# Vercel Services deployment

The repository defines two services in root `vercel.json`:

| Service | Root | Framework | Public paths |
| --- | --- | --- | --- |
| `backend` | `backend/` | FastAPI, entrypoint `app.main:app` | `/api` and `/api/*` |
| `frontend` | `frontend/` | Vite | All remaining paths |

Services is currently a Vercel Beta feature. Cloud deployment has not been verified.

## Routing and bindings

The API rewrite comes first and preserves `/api`, which FastAPI already uses. The frontend serves the React app and static assets. All current views use tabs at `/`, so no extra SPA fallback rewrite is needed. There is no additional root `app` service.

No bindings are declared: this Vite frontend is static, and its JavaScript calls the public API from the browser using relative `/api` URLs. No deployed function calls another service. Internal binding URLs are available only to runtime functions, not to static Vite code or build steps; do not set or expose an internal backend URL in client assets. Docker and standalone Vite retain their separate local proxies.

The backend bundles its snapshot and manifest through service-scoped function configuration. It reads `backend/requirements.txt` and `backend/.python-version`. No API keys or database are required. Optional `DECISION_CUTOFF_LOCAL=09:50` preserves the default UK-local cutoff.

## Test locally

From the repository root:

```sh
npx vercel dev --local --listen 3000
```

This starts the Services router without linking or deploying a cloud project. Local Python dependencies are installed into the backend virtual environment. The CLI's Python launcher must be available as `python3`; on Windows an app-execution alias may need correcting. `vercel dev` without `--local` can link to an existing project and pull its environment settings.

Verify the running router:

```powershell
.venv/Scripts/python -B -m backend.tests.runtime_smoke --base-url http://localhost:3000
```

Standalone local and Docker setup remain documented in README.

## Import in Vercel

After confirming the service names/exposure and pushing this configuration:

1. Import https://github.com/SohamUser/pjijxgvh from `main`.
2. Keep Root Directory at `./` and choose the **Services** application preset.
3. Refresh the service detection. Expect only FastAPI `backend` and Vite `frontend`; the suggested root Python `app` is obsolete.
4. Use the checked-in per-service build settings rather than old top-level Vite build overrides. The frontend installs with `npm ci`, builds with `npm run build`, and outputs `dist` relative to its own root.
5. Review the plan and environment settings, then deploy when ready.

## Verify the actual deployment

Use the real generated origin:

```powershell
.venv/Scripts/python -B -m backend.tests.runtime_smoke --base-url <ACTUAL_PUBLIC_ORIGIN>
```

Open the app signed out and verify forecasts, publication timestamps, actuals, January 31 to February 1 rollover, accuracy filters and CSV. Confirm `/api/health`, `/api/coverage`, `/api/docs` and `/api/openapi.json` reach FastAPI; unknown `/api/*` paths must return API 404s rather than the SPA. Check static assets, root-page refreshes, and mobile layout. Add a live URL to README only after verification.

## Local verification

Vercel CLI 65.2.0 detected exactly these two services. The local Services router passed the HTTP endpoint/schema smoke checks, preserved JavaScript/SVG content types, and rendered the real dashboard. The default Windows `python3` Store alias initially prevented FastAPI startup; the successful check used a temporary ignored launcher pointing to the installed Python. No system Python settings were changed. Backend tests (30 passed, one live test skipped), frontend tests (five passed), the frontend production build, and Compose configuration validation also passed. Cloud function packaging and public access remain unverified until an actual deployment is tested.
