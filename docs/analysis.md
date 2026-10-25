# January 2026 analysis

The results below use the default January 1–31 purchase decisions at 09:50 GMT, for January 2–February 1 delivery. The cutoff is now configurable; changing it requires recomputation rather than reusing these default scores. Each hour uses the latest eligible publication. Actuals are the mean of the two FUELHH WIND half-hours. Forecast representativeness across the hour is an explicit, unconfirmed assumption.

## Findings from the bundled snapshot

- Complete coverage: 744/744 selected forecast hours and matched outcomes.
- Mean absolute error: **2,013.01 MW**.
- Root mean squared error: **2,505.94 MW**.
- Mean signed error: **+1,729.93 MW**, using forecast minus actual.
- Nearest-rank P90 absolute error: **4,145.50 MW**.
- MAPE: **21.6102%**, using **744 nonzero matched hourly actuals**, with **0 excluded hours**.
- Largest daily MAE: **January 27 decision**, January 28 delivery, **5,374.79 MW**.
- Other large misses: January 11 decision, **4,900.88 MW**; January 10 decision, **4,897.10 MW**.
- Smallest daily MAE: **January 8 decision**, January 9 delivery, **797.06 MW**.
- Illustrative January 15 decision: forecast energy **191.402 GWh**, peak **10,850 MW**, minimum **5,881 MW**; delivery January 16. Verify exact energy against the API before narration if data is refreshed.

## Meaning for the client

Overestimating available wind can leave more energy to procure than expected. This pilot makes that direction and historical magnitude visible. It does not establish the utility’s exposure: demand, contracted renewable share and existing hedges are absent.

The strong positive bias is a prompt to investigate comparability, not proof of a faulty forecasting model. WINDFOR and FUELHH are the required source series, but their measured populations and methods can differ. The reported metrics quantify their observed difference after the stated temporal alignment.

Monthly P90 is calculated retrospectively from all January decisions. It must not be presented as a reserve that was known on January 1, as a 90% future guarantee, or as an independently validated confidence interval. With only 31 correlated delivery days, observations are not independent evidence of long-term performance.

The API and charts retain MW units. Estimated daily forecast energy assumes representative power over 24 one-hour intervals; no multiplication by 0.5 is applied after hourly aggregation. Missing halves invalidate that hour’s actual comparison.

## Source definitions and interval alignment

The exact requested endpoints were inspected through their [official OpenAPI schema](https://data.elexon.co.uk/swagger/v1/swagger.json): [FUELHH stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) and [WINDFOR stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream). Both are flat JSON arrays. Their generation fields are numeric and nullable; timestamps include timezones. Existing validation, WIND filtering, revision handling and source hashes are retained.

| Source | Verified stored cadence | Units and meaning |
| --- | --- | --- |
| FUELHH WIND | 1,488 records: 744 at HH:00, 744 at HH:30 | Endpoint description explicitly defines average MW over each half-hour. These are power values; interval energy is MW × 0.5 hours. |
| WINDFOR | All 22,192 retained rows target HH:00 | Hourly aggregate wind-power forecast in MW, not MWh. The inspected modern documentation does not explicitly define it as hour-average, instantaneous or interval-peak power. |

The [official Elexon wind-generation page](https://bmrs.elexon.co.uk/wind-generation) corroborates hourly forecasts, a fleet visible to NESO with operational metering, and use of fuel-type outturn for visual comparison. This supports a contextual comparison of related GB series, not proof of identical fleet membership or identical temporal averaging. The [legacy Elexon message specification](https://bscdocs.elexon.co.uk/bsc-module/interface-definition-documents/neta-interface-definition-and-design-document-part-1-interfaces-with-bsc-parties-and-their-agents/v-57-0/id-67b34bd747c7f13fbb2970f5), section 4.13.5.20, uses peak/half-hour terminology and an older message schedule. It cannot establish that modern hourly stream records are interval-average forecasts. Do not silently equate these contracts.

### Mapping decision

Retain the explicit conditional hourly comparison: selected forecast at HH:00 against the mean of actual HH:00 and HH:30, requiring both actuals. Equal half-hour weights yield the actual hour-average. Forecast publication information remains attached to the selected target. Metrics use MW for both sides, but interpretation still assumes the forecast is representative of that hour.

Assigning the hourly forecast to both half-hours would require a constant-within-hour assumption. It is mathematically possible but would not create observed half-hour forecasts or establish the correct meaning of the source value. It also changes MAE, RMSE, MAPE and sample counts; doubled samples are not independent information. For forecast 100 MW and actuals 80/120 MW, the current hourly MAE is zero, whereas a constant split yields 20 MW. Neither interpolation nor duplication is implemented. A defensible half-hour mapping remains unresolved pending Elexon/source confirmation or explicit acceptance by the assignment owner.

Forecast energy is now labeled estimated in the UI. `forecastEnergyMwh` retains its existing API name for compatibility and sums forecast MW × one hour, explicitly conditional on representative/constant hourly power. It is not source-provided interval energy. Existing default scores remain 744 matched hours, MAE 2013.0081 MW, RMSE 2505.9431 MW, bias +1729.9315 MW, P90 4145.5 MW and MAPE 21.6102% (744 included, zero excluded). They describe this stated comparison, not a validated half-hour forecasting model.

## Decision cutoff

The assignment does not specify a clock time or exchange auction. [Nord Pool's GB Product Specifications, effective 10 July 2023](https://www.nordpoolgroup.com/4a3355/globalassets/download-center/rules-and-regulations/product-specifications-gb-valid-from-10-july-23.pdf), section 3.1, lists gate closure at 09:50 GMT/BST; section 1.2 defines UK-local time references. This is authoritative support for that published GB auction specification, not independent confirmation of the client's purchasing workflow, all GB auctions, or the exact rule version applicable in January 2026.

Keep 09:50 as the default project assumption, now configurable through `DECISION_CUTOFF_LOCAL` in strict HH:MM format. `backend/app/config.py` validates it; `Analysis` reads it when constructed and combines each decision date with Europe/London before converting to UTC. Only publishTime <= cutoff is eligible; choose the greatest eligible publication separately for each hourly delivery target. Changing the cutoff changes available forecasts and may change metrics and coverage. Publication time remains an availability proxy, without transmission-latency data.

January 1–31 purchasing decisions target January 2–February 1 delivery. January UK time equals UTC/GMT; aware input offsets normalize to UTC and naive inputs fail. The pilot still only supports this fixed January window, not arbitrary DST days.

Compose passes the optional root `.env` setting to the backend. Standalone Python requires a process environment variable; it does not implicitly load `.env`. Restart/recreate the API after changes because analysis is cached. `/api/coverage` returns `decisionCutoffLocal`; decision timestamps, CSV, overview labels and methodology use the same value. There is no per-request cutoff override and no new UI control.

## Metric definitions and missing data

Error is forecast minus actual, in MW. MAE is the mean absolute error; RMSE is the square root of mean squared error; mean bias is the mean signed error. P90 uses the nearest-rank 90th percentile of absolute errors. Monthly scores pool matched observations rather than averaging daily scores.

MAPE is mean(abs(error) / abs(actual)) × 100 for matched, finite, nonzero actuals. `mapeCount` reports included observations; `mapeExcludedCount` counts expected points excluded because of missing pairs or zero actuals. Valid zero actuals remain in MAE, RMSE and bias. Empty scores are null; rounding happens only for presentation.

Identical revisions collapse. Conflicting values for the same delivery/publication timestamp fail validation. Latest null revisions remain missing instead of falling back to an older observation. Both actual half-hours are required for an hourly comparison.

## Data completeness and refresh limits

Daily ingestion validates response shape, timestamps, numeric values and actual coverage; the complete snapshot must cover all 744 comparisons. Requests have a 60-second timeout and up to four attempts for transient errors. All downloads and coverage checks finish before existing files are replaced.

Checksums establish stored-byte integrity, not upstream completeness. A valid response omitting a newer forecast can remain undetected if an older eligible publication preserves coverage. Files are replaced atomically individually; a crash during final promotion can still leave mismatched snapshot/manifest generations. Verify hashes after refresh and restart the API to clear its cached analysis.
