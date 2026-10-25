# Wind Desk

A focused pilot for a Great Britain day-ahead trading team: replay the wind forecast available at the decision cutoff, then measure its error against reported outturn.

**Live application:** pending deployment; no verified public application URL is available. See [deployment instructions](docs/deployment.md).

**Public repository:** https://github.com/SohamUser/pjijxgvh

**Demo video:** pending recording and unlisted YouTube upload by the submitter. Do not submit the assignment until the video is available. See [the timed demo script](docs/demo-script.md).

Deployment, recording/upload and form submission are **intentionally deferred**. The latest scoped follow-up is [source semantics and cutoff review](docs/source-semantics.md), including the unresolved interval interpretation and manual repository rename.

## Dashboard and key features

- **Decision overview:** select a January purchasing date, inspect the next-day hourly forecast, energy/peak/minimum/coverage cards and publication provenance. Toggle retrospective actuals, expand the interval table, or export CSV.
- **Forecast accuracy:** filter purchasing dates, inspect MAE, RMSE, bias and P90, compare daily errors and hourly bias, then drill into the largest daily misses.
- **Data & methodology:** inspect source links, retrieval time, coverage, cutoff assumptions and the interpretation of errors. MAPE and its sample counts are available through the API.

Loading skeletons, missing-value indicators, empty/partial-data messages and retry/timeout handling distinguish unavailable data from valid zero generation. Navy, teal and amber separate navigation, forecasts and retrospective actuals. The layout supports desktop and mobile; this description is provided instead of static screenshots.

## Architecture and data flow

`Elexon WINDFOR/FUELHH → Python ingestion and validation → raw responses + checksums + snapshot → cutoff selection and actual matching → accuracy calculations → FastAPI → React charts/tables/CSV`

Ingestion is an explicit offline command. FastAPI caches the bundled historical analysis per worker, so dashboard interactions do not depend on live Elexon availability. Vite proxies `/api` during development; Nginx does so in Docker. The Vercel configuration intends static React assets and a Python function on the same origin. See [architecture](docs/architecture.md) and [pipeline review](docs/pipeline-review.md).

## Run with Docker

Requirements: Docker Desktop with the Linux engine running, or Docker Engine with Compose. From the repository root:

```sh
docker compose up --build -d
```

- Application: http://localhost:8000
- API reference through the application: http://localhost:8000/api/docs
- Direct backend: http://localhost:8001/api/health

Compose starts two independent, non-root containers. The frontend builds React and serves it with Nginx; requests under `/api` are proxied to FastAPI. The backend includes the verified historical snapshot and needs no API key or network access at runtime. Stop both with `docker compose down`.

Optional host port overrides are documented in `.env.example`. Copy it to `.env` to change them. If replacing the previous single-container setup, use `docker compose up --build -d --remove-orphans` once to remove the retired `app` service.

## Run locally

Use Python 3.12+ and Node.js 22.12+ (or 24). These commands run from the repository root:

```sh
python -m venv .venv
# Windows PowerShell
.venv/Scripts/python -m pip install -r backend/requirements.txt
.venv/Scripts/python -m uvicorn backend.app.main:app --reload --port 8001
```

On macOS/Linux, substitute `.venv/bin/python` for `.venv/Scripts/python`. Alternatively, from `backend/`, the application entrypoint is `app.main:app`.

In a second terminal:

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

On Windows, stop an existing Vite process before running `npm ci`: its native CSS dependency can otherwise remain locked (`EPERM`).

Open the Vite URL printed in the terminal, normally http://127.0.0.1:5173. Its `/api` proxy targets port 8001. `VITE_API_PROXY_TARGET` in the root `.env` can override this development target. You can also run Vite against the Docker backend while Compose is running.

Choose a standalone Python backend or the Docker backend for port 8001; do not start both on that port. Stop Compose with `docker compose stop` before using the standalone backend if necessary.

## Environment configuration

Copy `.env.example` to a local `.env` only if defaults need changing. Replace the angle-bracket placeholders below with actual values; do not commit `.env`.

| Variable | Placeholder | Default | Applies to |
| --- | --- | --- | --- |
| `FRONTEND_PORT` | `<AVAILABLE_FRONTEND_HOST_PORT>` | `8000` | Docker frontend host port |
| `BACKEND_PORT` | `<AVAILABLE_BACKEND_HOST_PORT>` | `8001` | Docker backend host port |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:<BACKEND_HOST_PORT>` | `http://127.0.0.1:8001` | Vite development upstream; restart Vite after changing |
| `DECISION_CUTOFF_LOCAL` | `<HH:MM>` | `09:50` | Python UK-local purchasing-time assumption; restart backend after changing |

Browser requests remain relative `/api`; Docker uses internal `backend:8000` regardless of host-port overrides. The intended same-origin production configuration needs no API keys or secrets. Production settings and public routing remain unverified. Separate-origin hosting would require an explicit CORS policy.

Compose reads `DECISION_CUTOFF_LOCAL` from the root `.env` and passes it to Python. Standalone Python does not automatically read `.env`: set `$env:DECISION_CUTOFF_LOCAL = '09:50'` in PowerShell before starting Uvicorn (POSIX: `export DECISION_CUTOFF_LOCAL=09:50`). Use exactly `HH:MM`; invalid values make analysis unavailable with 503. The API exposes the configured value in `/api/coverage`; decision timestamps, CSV and dashboard labels use the same configuration. Restart/recreate the backend after changing it, because analysis is cached.

## Repository structure

```text
frontend/
  src/
    App.tsx                   Application shell and view state
    main.tsx                  React entrypoint
    components/               Shared metric components and shadcn/ui
    pages/                    Decision, accuracy and methodology views
    services/windApi.ts       HTTP requests and error handling
    types/index.ts            Frontend API response types
    lib/                      Formatting and class-name helpers
    styles.css                Theme tokens and page layout
  public/                     Favicon
  tests/                      API-client error, timeout and cancellation tests
  Dockerfile                  React build + non-root Nginx image
  nginx.conf                  Static serving and backend proxy
  package.json                Frontend dependencies and scripts
  components.json             shadcn registry configuration
backend/
  app/
    main.py                   FastAPI application setup
    config.py                 Fixed pilot dates and data path
    api/routes.py             Read-only API endpoints and CSV export
    services/
      elexon_client.py        Offline downloads and provenance manifest
      forecast_selection.py  Timestamp normalization and as-of selection
      accuracy.py            Error metrics and pair-weighted summaries
    schemas/responses.py      Validated API response contracts
  data/                       Snapshot, raw Elexon responses and checksums
  tests/                      Analytical and API tests
  Dockerfile                  Non-root Python API image
  requirements.txt            Backend dependencies
api/index.py                  Small Vercel adapter, not application logic
requirements.txt              Vercel dependency pointer to backend requirements
docker-compose.yml            Starts frontend and backend together
.env.example                  Optional local configuration
docs/                         Architecture, analysis, demo and submission guide
vercel.json                   Frontend build and Python function routing
```

The root Vercel adapter and dependency pointer are deployment compatibility files. Frontend and backend dependency definitions remain in their own directories.

## Decision and analysis rules

- “January decisions” means January 1–31, 2026, with delivery January 2–February 1.
- The pilot defaults to **09:50 Europe/London**, configurable using `DECISION_CUTOFF_LOCAL`. [Nord Pool's GB product specification](https://www.nordpoolgroup.com/4a3355/globalassets/download-center/rules-and-regulations/product-specifications-gb-valid-from-10-july-23.pdf), sections 1.2 and 3.1, documents 09:50 UK time for its GB auction. The assignment names no auction or exact deadline; applying it to this client remains an assumption, not an assignment requirement or universal GB market rule.
- Source timestamps must include a timezone and are normalized to UTC; output timestamps use `Z`. January UK local time equals UTC/GMT. Configuration is at backend startup, not per-browser selection.
- For each delivery hour, select the maximum WINDFOR `publishTime` at or before that decision cutoff. Publication time is an availability proxy; transmission latency is unknown.
- All 22,192 stored January-relevant WINDFOR records target HH:00. The 1,488 FUELHH WIND records target HH:00/HH:30. The [official wind page](https://bmrs.elexon.co.uk/wind-generation) corroborates hourly MW forecasts and comparison with fuel-type outturn. FUELHH is explicitly average MW over 30 minutes; the inspected modern WINDFOR documentation does not establish hour-average versus point/peak power semantics. See the source review for the legacy specification ambiguity.
- Retain the existing **conditional hourly comparison**: compare forecast HH:00 with the equal-weight mean of actual HH:00 and HH:30, requiring both halves. This assumes the forecast represents the corresponding hour. No interpolation or half-hour duplication is performed; original forecast publication timestamps survive matching.
- This is an **hourly comparison**, not compliance with a strict 30-minute-output requirement. Hourly averaging can cancel opposite half-hour errors. An agreed mapping of hourly WINDFOR to half-hour delivery intervals is required before claiming half-hour accuracy.
- Both series are MW, not MWh. Estimated forecast energy assumes constant representative power across the hour: sum MW × 1 hour for MWh, then divide by 1,000 for GWh. It is an assumption-based estimate, not source-supplied energy. Partial coverage produces explicitly partial totals.
- Error = forecast − actual. Positive error means wind overestimation. MAE = mean absolute error; RMSE = square root of mean squared error; bias = mean signed error. P90 is the nearest-rank 90th percentile of absolute error.
- Monthly metrics use all matched pairs, not a mean of daily scores. Missing pairs are excluded and counts shown. Zero is a valid observation.
- The API additionally returns `mape = mean(abs(errorMw) / abs(actualMw)) * 100` using only matched finite, nonzero actuals. `mapeCount` reports included hours; `mapeExcludedCount` counts all expected hours excluded for missing/invalid pairs or zero actuals. Zero actuals still contribute to MAE, RMSE and bias. MAPE is a percentage; the other error metrics are MW. Calculations use unrounded values; display rounding is presentation only.
- Numeric generation strings are converted to numbers. Null generation remains missing, including a latest null revision; it never silently falls back to an older non-null forecast or actual. Booleans, negative generation, NaN, infinity and malformed timestamps are rejected.
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

MAPE is **21.6102%**, with **744 included hours and 0 excluded hours**, under the same hourly policy. The API exposes MAPE and its counts; the existing dashboard layout is unchanged.

These numbers describe the specified WINDFOR-versus-FUELHH comparison. Differences in dataset coverage can contribute to the measured gap; this is not an isolated measure of a weather model’s quality. See [analysis notes](docs/analysis.md).

## Data sources and refresh

Only these Elexon endpoints are used:

- [WINDFOR stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream), filtered by publication timestamps.
- [FUELHH stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream), filtered by settlement dates and `fuelType=WIND`.
- Their request contract was checked against the [official OpenAPI schema](https://data.elexon.co.uk/swagger/v1/swagger.json).

```sh
python -m backend.app.services.elexon_client
```

The script downloads December 25–January 31 forecast publications and January 2–February 1 actuals in daily batches. Seven pre-January days provide lookback for the first decision. Full selected forecast coverage was verified. Refresh requires internet access; restart the API after replacing its snapshot because the analysis is cached per process.

Raw data is retained for inspection, but only the combined snapshot and manifest are bundled in the Docker runtime and Python deployment. No request to Elexon is made when a user changes dates. All retained files live under `backend/data/`.

## Tests and deployment

```sh
.venv/Scripts/python -m unittest discover -s backend/tests -t backend -v
npm --prefix frontend run build
npm --prefix frontend test
npm --prefix frontend audit
```

The tests cover no-lookahead selection, exact cutoff inclusion, independent hourly selection, actual averaging, missing intervals, duplicates/conflicts, revision ordering, metric formulas, weighted aggregation, invalid dates, CSV and month-end rollover. Real-snapshot tests deliberately require complete coverage; a changed snapshot should trigger review rather than silently degrade the pilot.

The latest scoped follow-up passed **30 offline backend tests**, with one live integration test skipped by default, plus **five frontend tests**. The separate opt-in integration test previously passed four real Elexon requests. See [source review](docs/source-semantics.md) for current results and [pipeline review](docs/pipeline-review.md) for earlier verification. The source-data fixture was not refreshed.

The subsequent [end-to-end QA report](docs/qa-validation.md) records a clean Docker build, working Compose startup, endpoint/schema checks through Docker and Vite, five frontend API-client regression tests, and browser checks of loading, empty, partial, timeout and error/retry states. Dashboard requests time out after 15 seconds. Public deployment remains unverified.

To validate a running application over HTTP, use:

```sh
.venv/Scripts/python -B -m backend.tests.runtime_smoke --base-url http://localhost:8000
```

The separate opt-in live Elexon test and its PowerShell commands are documented in [pipeline review](docs/pipeline-review.md). It does not overwrite bundled observations. See [submission checklist](docs/submission-checklist.md) for outstanding delivery requirements.

## Interface

The UI uses official **shadcn/ui** components with Radix primitives and Tailwind v4. Navy provides structure, teal identifies forecasts, and amber identifies retrospective actuals and bias. The header is a text wordmark; icons are limited to export and previous/next actions. Source Sans 3 is bundled locally, so the core dashboard needs no external font or image requests. See [design decisions and skill sources](docs/design.md).

Deploy the repository to Vercel under the **Other** framework preset. The checked-in configuration builds Vite to `frontend/dist` and routes `/api/*` to the Python entrypoint. Disable deployment authentication for the public submission URL, then check it in an incognito session. Deployment is separate from Docker: Vercel uses its Python runtime, while Docker supports reproducible local execution.

## Deliberate limits

This is a national Elexon wind pilot, not a portfolio optimizer. It includes no demand, price, weather, contracted generation, storage or other fuels. It cannot calculate a client’s procurement volume, savings or reserve requirement. Elexon coverage is Great Britain and should not be presented as all UK wind output. January error distributions are descriptive, not calibrated prediction intervals. No trading actions, authentication, database service, scheduler or machine-learning model are included.

The hourly comparison does not meet a strict 48-half-hour-output requirement; confirm source interval semantics and agree a mapping policy before claiming compliance. The configurable cutoff defaults to 09:50 and requires client agreement. Completeness checks cannot detect every valid upstream omission of a newer forecast revision. Snapshot files are replaced individually, not as an all-file crash-safe transaction. Public deployment, video and form submission are deferred. The submitter estimates **4–5 active hours** spent on the assignment; this is self-reported, not independently verified by a time ledger.

## AI assistance

**OpenAI Codex was used** for domain/API research, implementation, analytical tests, UI development, documentation and verification. No AI predictions or synthetic wind observations are used in the product; all numerical data comes from the two specified Elexon datasets. The submitter should review and understand the implementation before recording the technical walkthrough.
