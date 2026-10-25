# Deploy to Vercel

The code is deployment-ready but **has not been deployed**. The connected team returned `403: You don't have permission to create a project`; the CLI fallback reported no existing credentials. As agreed, account sign-in and deployment are left to the submitter.

## CLI route

From the repository root, sign in interactively on your own machine:

```sh
npx vercel login
npx vercel --prod
```

Select the account/team where you can create projects, link a new project named `gidbrivks`, use the current directory, and keep the framework preset **Other**. The tracked `vercel.json` supplies builds and routes. Do not paste authentication tokens into chat, Git, README, or command arguments.

The frontend is built with `npm --prefix frontend run build`; Vercel’s Python builder uses `api/index.py`, `requirements.txt` and Python 3.12. The function explicitly includes `backend/app/`, `backend/data/snapshot.json` and `backend/data/manifest.json`. No environment secrets or external database are needed.

## Dashboard route

1. Import https://github.com/SohamUser/GidBricks into a Vercel team where you have project-creation permission.
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

Add the verified production URL to README and `docs/submission-checklist.md`, commit, and push. Then record the demo against that deployment and add the unlisted video URL. The application and video URLs cannot be access-verified until they exist.

## Docker verification

Docker build and startup were verified after the Linux engine was started. The frontend container serves the compiled shadcn UI and proxies to the separate Python API container at http://localhost:8000. To repeat:

```sh
docker compose up --build
```

Open http://localhost:8000 and repeat the API/coverage checks above. The API reference is http://localhost:8000/api/docs. Stop with `docker compose down`.

The root `requirements.txt` points to `backend/requirements.txt` for Vercel. Keep the Vercel project root at the repository root; `vercel.json` installs/builds the frontend package and publishes `frontend/dist` alongside the Python function. Cloud deployment is still pending account access; this refactor was verified locally and in Docker.
