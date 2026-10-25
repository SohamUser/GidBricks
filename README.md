# Wind Desk

A focused pilot for a Great Britain day-ahead trading team: replay the wind forecast available at the decision cutoff, then measure its error against reported outturn.

**Live application:** deployment URL will be added after production verification.

**Public repository:** https://github.com/SohamUser/gidbrivks

**Demo video:** pending recording and unlisted YouTube upload by the submitter. Do not submit the assignment until the video is available. See [the timed demo script](docs/demo-script.md).

## Run with Docker

Requirements: Docker Desktop with the Linux engine running, or Docker Engine with Compose.

```sh
docker compose up --build
```

Open http://localhost:8000. The image includes the verified historical snapshot; no API key or network access is required at runtime. The same FastAPI application serves both the API and compiled React frontend. Stop with `docker compose down`.

## Run locally

Use Python 3.12+ and Node.js 22.12+ (or 24).

```sh
python -m venv .venv
# Windows PowerShell
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m uvicorn backend.main:app --reload
```

On macOS/Linux, substitute `.venv/bin/python` for `.venv/Scripts/python`.

In a second terminal:

```sh
npm ci
npm run dev
```

Open the Vite URL printed in the terminal. Vite proxies `/api` to port 8000. For the production-style local app, run `npm run build`, restart FastAPI without `--reload`, and open http://localhost:8000.

## Repository structure

| Path | Purpose |
| --- | --- |
| `frontend/` | React shell, separate decision/accuracy/methodology views, shared presentation helpers, API types, responsive styles |
| `backend/analysis.py` | Pure timestamp normalization, as-of forecast selection, interval alignment and metrics |
| `backend/main.py` | Read-only FastAPI endpoints, input validation, CSV export and local static serving |
| `scripts/fetch_data.py` | Bounded Elexon downloads with timeouts, retry/backoff, raw responses and checksums |
| `data/raw/` | Original Elexon JSON responses for audit and reproducibility |
| `data/snapshot.json` | Combined snapshot used by the backend |
| `data/manifest.json` | Retrieval timestamp, request URLs, row counts and SHA-256 checksums |
| `tests/` | Analytical fixtures, boundary checks and integration tests against the real snapshot |
| `docs/` | Architecture, verified results, demo narration and submission checklist |
| `api/index.py`, `vercel.json` | Vercel Python function entrypoint and static/API routing |
| `Dockerfile`, `compose.yaml` | Multi-stage React build and non-root Python runtime |

## Decision and analysis rules

- “January decisions” means January 1–31, 2026, with delivery January 2–February 1.
- The pilot assumes a **09:50 Europe/London** decision cutoff, based on the [GB N2EX auction convention](https://www.nordpoolgroup.com/en/message-center-container/newsroom/exchange-message-list/2020/q4/nord-pool-announces-gb-auction-changes-for-brexit/). All relevant dates are GMT. This is an explicit pilot assumption, not a universal cutoff for every GB auction.
- For each delivery hour, select the maximum WINDFOR `publishTime` at or before that decision cutoff. Publication time is an availability proxy; transmission latency is unknown.
- The actual January WINDFOR data is **hourly**, although FUELHH is half-hourly. Compare the forecast at HH:00 with the mean of FUELHH WIND at HH:00 and HH:30. Require both actual half-hours. No interpolation or fabricated half-hour forecasts.
- Power is MW. Each aligned forecast is treated as the average for the hour beginning at `startTime`; sum hourly values for MWh and divide by 1,000 for GWh. Partial coverage produces explicitly partial totals.
- Error = forecast − actual. Positive error means wind overestimation. MAE = mean absolute error; RMSE = square root of mean squared error; bias = mean signed error. P90 is the nearest-rank 90th percentile of absolute error.
- Monthly metrics use all matched pairs, not a mean of daily scores. Missing pairs are excluded and counts shown. Zero is a valid observation.
- Identical duplicates collapse. Actual updates use the latest retrieved publication for the target interval. Same-publication conflicting values fail ingestion/analysis instead of being arbitrarily selected. The supplied response schema has no revision field. Later forecast publications remain separate candidates.

The portal offers retrospective actuals only through an explicit overlay. Its accuracy page is retrospective and must not be interpreted as information available during an early-January purchase decision.

## Verified pilot results

All **744 hourly pairs** are present (31 days × 24 hours), derived from **1,488 half-hour actuals**. At the assumed cutoff:

| Metric | MW |
| --- | ---: |
| MAE | 2,013.01 |
| RMSE | 2,505.94 |
| Bias | +1,729.93 |
| P90 absolute error | 4,145.50 |

These numbers describe the specified WINDFOR-versus-FUELHH comparison. Differences in dataset coverage can contribute to the measured gap; this is not an isolated measure of a weather model’s quality. See [analysis notes](docs/analysis.md).

## Data sources and refresh

Only these Elexon endpoints are used:

- [WINDFOR stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream), filtered by publication timestamps.
- [FUELHH stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream), filtered by settlement dates and `fuelType=WIND`.
- Their request contract was checked against the [official OpenAPI schema](https://data.elexon.co.uk/swagger/v1/swagger.json).

```sh
python -m scripts.fetch_data
```

The script downloads December 25–January 31 forecast publications and January 2–February 1 actuals in daily batches. Seven pre-January days provide lookback for the first decision. Full selected forecast coverage was verified. Refresh requires internet access; restart the API after replacing its snapshot because the analysis is cached per process.

Raw data is retained for inspection, but only the combined snapshot and manifest are bundled in the Docker runtime and Python deployment. No request to Elexon is made when a user changes dates.

## Tests and deployment

```sh
.venv/Scripts/python -m unittest discover -s tests -v
npm run build
npm audit
```

The tests cover no-lookahead selection, exact cutoff inclusion, independent hourly selection, actual averaging, missing intervals, duplicates/conflicts, revision ordering, metric formulas, weighted aggregation, invalid dates, CSV and month-end rollover. Real-snapshot tests deliberately require complete coverage; a changed snapshot should trigger review rather than silently degrade the pilot.

Deploy the repository to Vercel under the **Other** framework preset. The checked-in configuration builds Vite to `dist` and routes `/api/*` to the Python entrypoint. Disable deployment authentication for the public submission URL, then check it in an incognito session. Deployment is separate from Docker: Vercel uses its Python runtime, while Docker supports reproducible local execution.

## Deliberate limits

This is a national Elexon wind pilot, not a portfolio optimizer. It includes no demand, price, weather, contracted generation, storage or other fuels. It cannot calculate a client’s procurement volume, savings or reserve requirement. Elexon coverage is Great Britain and should not be presented as all UK wind output. January error distributions are descriptive, not calibrated prediction intervals. No trading actions, authentication, database service, scheduler or machine-learning model are included.

## AI assistance

**OpenAI Codex was used** for domain/API research, implementation, analytical tests, UI development, documentation and verification. No AI predictions or synthetic wind observations are used in the product; all numerical data comes from the two specified Elexon datasets. The submitter should review and understand the implementation before recording the technical walkthrough.
