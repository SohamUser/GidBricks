# Focused pipeline correctness review

This is the earlier verification record. The subsequent [source-semantics review](source-semantics.md) adds a configurable cutoff, clarifies that hour-average forecast semantics remain unconfirmed, and records the current tests.

## Decision contract

January means purchasing decisions on January 1–31, 2026, at a default 09:50 Europe/London cutoff. This remains a pilot assumption, now configurable at backend startup with `DECISION_CUTOFF_LOCAL`; there is no per-request cutoff override. Delivery is the following calendar day, January 2–February 1 inclusive. The January 31 decision therefore includes February delivery.

All input `startTime` and `publishTime` values must carry an offset. They normalize to UTC; API output uses `Z`. UK local time is GMT throughout this fixed window. This implementation is not a general DST-day calculator.

For each delivery target, select the greatest forecast `publishTime` less than or equal to the decision cutoff. Do not select by delivery date alone or by the newest publication in the entire snapshot. Publication time is an availability proxy; source transmission latency is unknown. Actuals use the latest retrieved revision, retrospectively, not information available at the purchasing cutoff.

## Cadence and equations

Fresh January boundary requests returned hourly WINDFOR targets and half-hourly FUELHH WIND targets. The existing analysis compares each hourly forecast with the mean of the actuals at HH:00 and HH:30, requiring both actual values. The join uses normalized delivery `startTime`, never publication time. This assumes the forecast value represents the hour beginning at its target timestamp.

This hourly adaptation is explicit and remains unchanged. It does not satisfy a strict requirement for 48 half-hour output intervals. Opposite errors within an hour can cancel. For example, a 100 MW forecast versus actuals 80/120 MW yields zero hourly error. A half-hour mapping must be agreed before presenting half-hour metrics; no intermediate forecasts have been invented.

- `errorMw = forecastMw - actualMw`; positive means wind overestimation.
- `MAE = mean(abs(errorMw))`.
- `RMSE = sqrt(mean(errorMw ** 2))`.
- `bias = mean(errorMw)`.
- `MAPE = mean(abs(errorMw) / abs(actualMw)) * 100`, only for matched finite, nonzero actuals.
- P90 uses the nearest-rank 90th percentile of absolute errors.

Errors are MW; MAPE is percent. Hourly energy is MW multiplied by one hour, giving MWh. No rounding occurs before scoring. Monthly scores pool pairs rather than averaging daily scores. `count` is matched finite errors. `mapeCount` is included percentage-error observations; `mapeExcludedCount` is expected points minus included observations, including missing pairs and zero actuals. Empty scores are null, not zero. Valid zero actuals remain in absolute/signed error metrics.

Numeric strings convert to numbers; null remains missing. The latest null publication is retained as missing instead of falling back to an older value. Identical revisions collapse; conflicting values for the same delivery/publication fail regardless of input order. Booleans, NaN, infinity, negative generation and invalid timestamps fail validation. Source null timestamps cannot establish an interval or ordering and are rejected.

## Elexon integration and completeness

Only the specified [FUELHH](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) and [WINDFOR](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) datasets are used. The [official OpenAPI schema](https://data.elexon.co.uk/swagger/v1/swagger.json) documents flat JSON arrays, not NDJSON or a pagination envelope. No pagination parameter is documented for these stream endpoints.

WINDFOR uses `publishDateTimeFrom/To`; FUELHH uses `settlementDateFrom/To` and `fuelType=WIND`. The application independently filters actuals to WIND; ingestion rejects a daily filtered response containing another fuel. Do not combine settlement and publication filters for FUELHH.

Retrieval covers daily publication windows December 25–January 31, plus actual settlement dates January 2–February 1. The pre-January lookback is bounded; it is not an assertion that every older publication has been retrieved. Offline checks independently verify that all 744 stored targets choose the latest eligible publication within the retained data. All 69 retained responses pass schema/window/coverage checks and their SHA256 hashes match the manifest.

Live checks observed 584 WINDFOR rows for each of January 1 and January 31 publication windows, and 48 WIND actual rows for each corresponding January 2 and February 1 delivery day. These counts are observations, not a hardcoded API contract. Historical availability is established for those sampled requests; all 69 requests were not re-downloaded.

Requests have a 60-second timeout and up to four attempts for 429, 5xx, network timeout/error or interrupted reads, with 1/2/4-second backoff. Other HTTP errors fail immediately. Invalid JSON and wrong response shapes fail validation. Daily actuals must cover all 48 unique half-hours with usable latest values; the completed snapshot must cover all 744 forecast/actual hourly pairs.

These checks detect malformed truncation, missing actual intervals and missing required forecast coverage. They cannot prove that a syntactically valid WINDFOR array contains every source publication: omission of a newer revision can be masked by an older eligible forecast. The stream contract has no total count or completeness token. Checksums prove stored-byte integrity, not upstream completeness. Do not claim that arbitrary silent upstream omissions are detectable.

All downloads and analytical validation complete before any existing file is overwritten. Individual files use temporary-write-and-replace to prevent partial JSON. This is not a transaction across all files: a disk failure or process termination during final promotion can still leave different generations of raw files, snapshot and manifest. Check hashes before release and restart the API after refresh; its analysis is cached per process.

## Verification

Run ordinary deterministic checks from the repository root:

```powershell
./.venv/Scripts/python -B -m unittest discover -s backend/tests -t backend -v
./.venv/Scripts/python -B -m ruff check --no-cache backend/app backend/tests api
./frontend/node_modules/.bin/tsc --noEmit -p frontend/tsconfig.json
```

The offline run passed 26 tests; the live test is skipped by default. Fixtures cover cutoff boundaries, duplicates, revisions, null/invalid generation, interval joins, signs, formulas including MAPE, zero actuals, timestamp offsets, February rollover, failed requests, retries, malformed/incomplete responses, snapshot readiness and unchanged data on failed download. Stored-data tests verify all retained checksums and independently check all selected publications and actual joins.

Run the separate read-only integration test:

```powershell
$env:RUN_ELEXON_INTEGRATION = '1'
./.venv/Scripts/python -B -m unittest discover -s backend/tests -t backend -p test_elexon_integration.py -v
Remove-Item Env:RUN_ELEXON_INTEGRATION
```

It passed one test with four live requests. No bundled observations were refreshed. Current hourly results remain MAE 2013.0081 MW, RMSE 2505.9431 MW, bias +1729.9315 MW and P90 4145.5 MW. MAPE is 21.6101568%, with 744 included and zero excluded hours.

The frontend layout was not redesigned. Public cloud deployment, Docker rebuild, complete live historical re-download and all-file crash consistency were not verified in this focused review. TestClient emits an existing Starlette/httpx deprecation warning.
