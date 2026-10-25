# End-to-end QA and operations validation

The verified story is: select a January decision in React, fetch Python-selected historical Elexon wind forecasts and actuals through a same-origin proxy, render metrics/charts/tables, and export the same selected intervals. React, Python, Docker and the two specified datasets are preserved. No public deployment or production setting was changed.

## Commands and observed exit statuses

Commands were executed from the repository root in Windows PowerShell. `.venv` already existed; its documented dependency installation was repeated. Docker application layers were built without cache; existing base-image storage was not purged.

| Command | Exit | Observation |
| --- | ---: | --- |
| `.venv/Scripts/python -m pip install -r backend/requirements.txt` | 0 | Dependencies installed/already satisfied |
| `npm --prefix frontend ci` (first attempt) | 1 | Windows EPERM: Lightning CSS was held open by the running Vite process |
| `npm --prefix frontend ci` (after stopping that project Vite process) | 0 | Clean installation succeeded; zero reported vulnerabilities |
| `.venv/Scripts/python -B -m unittest discover -s backend/tests -t backend -v` | 0 | 26 passed; one opt-in live test skipped |
| `npm --prefix frontend test` | 0 | Five API-client tests passed |
| `npm --prefix frontend run build` | 0 | TypeScript and production build succeeded |
| `npm --prefix frontend audit` | 0 | Zero reported vulnerabilities |
| `.venv/Scripts/python -m pip check` | 0 | No broken requirements |
| `.venv/Scripts/python -B -m ruff check --no-cache backend/app backend/tests api` | 0 | Passed |
| `docker compose build --no-cache` | 0 | Both images built successfully |
| `docker compose build --no-cache frontend` | 0 | Rebuilt after timeout/empty-state fixes |
| `docker compose up --build -d` | 0 | Both project containers started |
| `docker compose config --quiet` | 0 | Valid configuration |
| `.venv/Scripts/python -B -m backend.tests.runtime_smoke --base-url http://127.0.0.1:8011` | 0 | Temporary standalone Uvicorn API passed |
| `.venv/Scripts/python -B -m backend.tests.runtime_smoke --base-url http://localhost:8000` | 0 | Nginx-to-API flow passed |
| `.venv/Scripts/python -B -m backend.tests.runtime_smoke --base-url http://localhost:8001` | 0 | Direct Docker API passed |
| `.venv/Scripts/python -B -m backend.tests.runtime_smoke --base-url http://127.0.0.1:5173` | 0 | Vite proxy passed, both with custom 8011 target and restored default 8001 target |
| `docker compose ps` | 0 | Frontend and backend healthy |
| `docker compose logs --tail 12` | 0 | Expected successful and deliberately invalid request logs |
| `docker compose exec -T backend id` | 0 | Non-root UID 1000 |
| `docker compose exec -T frontend id` | 0 | Non-root UID 101 |
| `git diff --check` | 0 | No whitespace errors |

Long-running startup commands do not have a successful exit status while serving. `.venv/Scripts/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8011` reached application-startup-complete and served the smoke test; the temporary API was then stopped. Vite was started with `$env:VITE_API_PROXY_TARGET='http://127.0.0.1:8011'` and `npm --prefix frontend run dev -- --port 5173 --strictPort`, proving the custom development target. It was subsequently restarted with the normal default target, port 8001, and remains available on 5173. Docker remains available on 8000/8001.

Warnings: the existing Starlette/httpx TestClient deprecation; Vite's approximately 636 kB minified bundle warning. Neither failed a check. No bundle redesign or dependency upgrade was needed for this QA task.

## Endpoint results

The reusable read-only `backend/tests/runtime_smoke.py` validates Pydantic response contracts and exercises every frontend-facing endpoint over real HTTP. Health, decision, accuracy, coverage, CSV, docs and OpenAPI returned 200. January 1 maps to January 2; January 31 maps to February 1. Invalid dates and reversed ranges returned 422, unsupported POST returned 405, and unknown API routes returned 404. Coverage was 744/744 hourly comparisons. CSV for a single decision contained a header plus 24 rows. Calculated MAE and energy reconciled with returned interval values.

The runtime API reads bundled Elexon data and needs no Elexon network call or secret per request. No mock fallback was found in the production code. Offline tests verify every stored raw-response checksum and selected publication; real Elexon network verification is separate and opt-in, as recorded in `pipeline-review.md`. This QA pass did not refresh the data.

CORS is deliberately absent: browser requests stay on the frontend origin, through Vite or Nginx, and a request carrying an unrelated Origin receives no access-control-allow-origin permission. The current Vercel configuration also intends one origin. Hosting frontend and backend on separate origins would require explicit origin configuration and browser verification; that topology is not claimed to work.

Development upstream is configurable through `VITE_API_PROXY_TARGET`; browser requests remain relative `/api`. Docker's upstream is the Compose service `backend:8000`, independent of the configurable host `BACKEND_PORT`. Host `FRONTEND_PORT` and `BACKEND_PORT` defaults are 8000 and 8001. Frontend startup depends on backend health. No runtime production environment variables are required for this intended same-origin deployment; cloud settings were not available to verify.

## Browser checks and necessary fixes

Normal checks used real backend data. Browser-only response overrides in a separate isolated context exercised failure states; they were removed afterward and never written to production files or data.

- Decision date input, January endpoint bounds, next-day arrow, boundary-disabled previous/next controls, actual overlay and interval disclosure worked.
- January 31's first interval displayed forecast 10,474 MW, actual 8,593 MW, error 1,881 MW and publication January 31 09:30 GMT, matching the response.
- January 15 forecast energy 191.402 GWh displayed as 191.4 GWh, with publication 09:30 GMT.
- Accuracy range January 31 alone showed 24/24 comparisons and MAE 854.3 MW, matching backend 854.3125 MW. The daily table and ranked-day drill-down worked; drill-down selected the date and enabled actuals.
- Methodology navigation displayed snapshot coverage and links to both Elexon docs and the API reference.
- Forecast and actual chart paths rendered; both accuracy charts rendered. CSV URLs followed the selected decision/range and returned expected rows.
- Desktop 1440px and mobile 390px checks showed no page overflow. A full-page mobile accuracy screenshot was visually inspected. No console warnings/errors appeared in the normal Docker or Vite flows.
- Delayed requests displayed the loading status and skeletons.
- Empty forecast responses displayed missing values and the new “No eligible wind forecasts” message. Empty accuracy displayed “No matched observations” and zero coverage, without fabricated zero metrics.
- Partial fixtures displayed 23/24 forecast hours and 743/744 comparisons, with a new partial-comparison warning.
- Simulated 503 showed the API message and retry action. Restoring real requests and retrying loaded real values.
- Previously, a stalled request could leave the UI loading indefinitely. Requests now abort after 15 seconds with an actionable timeout message; a stalled-fetch browser check verified the full duration and error display. Five Node regression tests also cover URLs, API errors, non-JSON proxy errors, timeout and filter-change cancellation.

## Deployment verification checklist

- [x] Inspect root Vercel adapter, requirements pointer, Python version, frontend build/output, function data inclusion and API rewrites.
- [x] Verify intended same-origin behavior locally through Nginx and Vite.
- [x] Read-only Vercel project queries: no matching project found in connected team `team_xvF5GiCk1JUutzaYJnkBUTca`, by repository URL or original name.
- [ ] Obtain an actual deployment URL; none is supplied in README or the handoff checklist.
- [ ] Verify production framework/root overrides, function runtime, data packaging and environment settings in that project.
- [ ] After a separately approved deployment, run the runtime smoke command against the production origin.
- [ ] Verify public root, all API endpoints, January date selection, charts and CSV in a signed-out browser.
- [ ] Verify production HTTPS, routing on refresh, mobile layout, runtime logs, and protection settings.

No deployment, protection change, environment change, or resource deletion was performed. Configuration existence is not evidence of a working public app.

## Secrets and remaining manual checks

Only `.env.example` is tracked among checked environment/key paths. `.env`, `.env.local` and package-level environment files are ignored; both Docker build contexts exclude environment files. A targeted tracked-file scan found no private-key headers, AWS access-key patterns, GitHub personal token patterns or Stripe live-secret patterns. This is not a full Git-history or exhaustive secret audit.

Remaining checks: actual public deployment and production environment/routing, signed-out app/API access, additional browsers and physical mobile devices, video and final submission links. The prior hourly-versus-half-hour requirement gap remains explicit in `pipeline-review.md`. Refresh publication is not a transaction across the entire data-file set, and valid upstream omissions of forecast revisions cannot always be detected. These analytical limits were not disguised by UI changes.

To repeat local setup and Docker startup, use README. Stop Vite before Windows clean dependency installation. Choose standalone Python or the Docker backend for port 8001; do not start both on that same port.
