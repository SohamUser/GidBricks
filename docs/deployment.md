# Deploy to Vercel

The repository includes Vercel configuration for a static React frontend and Python API. Public deployment has not been verified.

## CLI route

From the repository root, sign in interactively on your own machine:

```sh
npx vercel login
npx vercel --prod
```

Select the account/team where you can create projects, link a new project named `pjijxgvh`, use the current directory, and keep the framework preset **Other**. The tracked `vercel.json` supplies builds and routes. Keep authentication tokens out of source control and command arguments.

The frontend is built with `npm --prefix frontend run build`; Vercel’s Python builder uses `api/index.py`, `requirements.txt` and Python 3.12. The function explicitly includes `backend/app/`, `backend/data/snapshot.json` and `backend/data/manifest.json`. No environment secrets or external database are needed.

## Dashboard route

1. Import https://github.com/SohamUser/pjijxgvh into a Vercel team where you have project-creation permission.
2. Select the **Other** preset and repository root. Leave custom overrides unset; use the checked-in configuration.
3. Deploy the `main` branch.
4. In project deployment protection settings, ensure the final production submission URL is publicly accessible.

## Verify before sharing

Open the production URL in incognito and confirm:

- The decision overview loads without a sign-in page.
- `/api/health` returns `status: ok` and `snapshotReady: true`.
- `/api/coverage` returns `matchedHours: 744` and `expectedHours: 744`.
- January 31 decision shows February 1 delivery.
- Forecast accuracy shows approximately 2,013.01 MW MAE and +1,729.93 MW bias.
- Export downloads a CSV with selected publications and actuals.
- Refreshing the root page works and mobile navigation fits.

Add the production URL to README only after verifying it. The demonstration video remains unpublished.

## Docker verification

Docker build and startup were verified after the Linux engine was started. The frontend container serves the compiled shadcn UI and proxies to the separate Python API container at http://localhost:8000. To repeat:

```sh
docker compose up --build
```

Open http://localhost:8000 and repeat the API/coverage checks above. The API reference is http://localhost:8000/api/docs. Stop with `docker compose down`.

The root `requirements.txt` points to `backend/requirements.txt` for Vercel. Keep the Vercel project root at the repository root; `vercel.json` installs/builds the frontend package and publishes `frontend/dist` alongside the Python function. Local execution and Docker have been verified; public deployment remains unverified.
