# Wind Desk

A React and Python application for reviewing Elexon wind-generation forecasts available before day-ahead purchasing decisions and evaluating their accuracy against actual generation.

The analysis covers purchasing decisions made in **January 2026**, with next-day delivery from **January 2 to February 1**.

- **Source code:** [GitHub repository](https://github.com/SohamUser/pjijxgvh)
- **Video demo:** [Wind Desk — Product Demo and Technical Walkthrough](https://youtu.be/ELFqrQeDc-k)
- **Live application:** [Wind Desk](https://pjijxgvh.vercel.app/)

## Features

- View the latest eligible wind forecast and its publication timestamps for a selected decision date.
- Compare forecasts with actual generation in charts and interval tables.
- Evaluate MAE, RMSE, mean bias and P90 absolute error across selected dates. MAPE and sample counts are also available through the API.
- Export the selected forecast, actuals and publication information as CSV.

## Project structure

```text
frontend/
  src/
    components/             Shared React and shadcn/ui components
    pages/                  Decision, accuracy and methodology views
    services/               Backend API client
    types/                  TypeScript response types
    lib/                    Formatting and UI helpers
    App.tsx                 Application navigation and state
    main.tsx                React entry point
    styles.css              Application styles
  tests/                    API-client tests
  public/                   Static assets
  Dockerfile                React build and Nginx runtime
  nginx.conf                Static serving and API proxy
  package.json              Frontend dependencies and commands
backend/
  app/
    main.py                 FastAPI entry point
    config.py               Data path, date range and cutoff configuration
    api/                    HTTP endpoints and CSV export
    services/               Elexon ingestion, forecast selection and metrics
    schemas/                API response models
  data/                     Elexon snapshot, raw responses and manifest
  tests/                    Analytical, API and integration tests
  Dockerfile                Python API image
  requirements.txt          Backend dependencies
  .python-version           Python version for the backend service
docker-compose.yml          Frontend and backend services
.env.example                Optional local configuration
vercel.json                 Two-service Vercel build and routing configuration
docs/                       Architecture, analysis and deployment guides
```

## Run with Docker

Requires Docker with Compose and the Linux engine running. From the repository root:

```sh
docker compose up --build -d
```

- Application: http://localhost:8000
- API documentation: http://localhost:8000/api/docs
- Backend health: http://localhost:8001/api/health

The bundled Elexon snapshot requires no API key or live network access to run the dashboard.

Stop the application:

```sh
docker compose stop
```

## Run locally

Requires **Python 3.12+** and **Node.js 22.12+ or 24**. From the repository root, start the backend:

```powershell
python -m venv .venv
.venv/Scripts/python -m pip install -r backend/requirements.txt
.venv/Scripts/python -m uvicorn backend.app.main:app --reload --port 8001
```

On macOS/Linux, use `.venv/bin/python` instead of `.venv/Scripts/python`.

In a second terminal, start the frontend:

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open http://127.0.0.1:5173. Stop any existing Vite process before running `npm ci` on Windows. Use either the standalone backend or Docker's backend on port 8001.

### Configuration

Defaults work without a local environment file. Copy `.env.example` to `.env` to change Docker ports or the development API target.

| Variable | Default | Purpose |
| --- | --- | --- |
| `FRONTEND_PORT` | `8000` | Docker frontend host port |
| `BACKEND_PORT` | `8001` | Docker backend host port |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:8001` | Vite development API upstream |
| `DECISION_CUTOFF_LOCAL` | `09:50` | Purchasing cutoff in Europe/London time, using `HH:MM` |

Compose passes the cutoff to the backend. For standalone Python, set it in the process environment before starting the API, for example `$env:DECISION_CUTOFF_LOCAL = '09:50'` in PowerShell. Restart the backend after changing it. Local `.env` files are ignored by Git.

## Data and methodology

Only the specified Elexon datasets are used:

- [FUELHH](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream): actual generation filtered to `fuelType=WIND`.
- [WINDFOR](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream): wind forecasts with delivery `startTime` and forecast `publishTime`.

For each delivery target, select the latest forecast published **at or before the decision cutoff**. The default 09:50 UK cutoff is a configurable project assumption; the assignment does not specify an exact time. Timestamps are normalized to UTC, which equals UK GMT during January.

The retained WINDFOR records are hourly; FUELHH records are half-hour averages in MW. The application compares each forecast with the mean of the two corresponding actual half-hours, requiring both. This assumes the forecast represents its target hour: source hour-average semantics remain unconfirmed. Forecasts are not duplicated or interpolated into half-hours, and forecast energy is labeled estimated. This implementation provides hourly comparisons rather than 48 half-hour outputs.

Error is **forecast minus actual**, so positive bias means wind overestimation. MAE is mean absolute error, RMSE is the square root of mean squared error, and bias is mean signed error. Missing pairs are excluded with coverage counts. MAPE excludes zero actuals and reports included/excluded counts. Monthly scores pool matched observations.

The default snapshot contains **744 matched hourly comparisons**. These national series do not establish a utility's purchase volume without demand, contracted supply and existing positions. Historical errors are descriptive, not future confidence intervals.

See [analysis and source assumptions](docs/analysis.md) and [architecture](docs/architecture.md) for details.

To refresh the snapshot from Elexon:

```sh
python -m backend.app.services.elexon_client
```

Refresh requires internet access. Restart the API afterward to reload its cached analysis.

## Tests

From the repository root:

```powershell
.venv/Scripts/python -m unittest discover -s backend/tests -t backend -v
npm --prefix frontend test
npm --prefix frontend run build
```

The live Elexon integration test is opt-in; ordinary tests use deterministic fixtures and bundled data.

## Deployment

Vercel Services (Beta) builds `frontend` (Vite) and `backend` (FastAPI) independently under one domain. `/api/*` routes to the backend and all other paths to the frontend. The static browser app uses relative API URLs; there are no server-to-server calls or internal bindings. The application URL is [pjijxgvh.vercel.app](https://pjijxgvh.vercel.app/). See [deployment instructions](docs/deployment.md).

## AI assistance

**OpenAI Codex** was used for research, implementation, testing and documentation. All wind-generation observations come from the specified Elexon datasets; no AI-generated observations are used.
