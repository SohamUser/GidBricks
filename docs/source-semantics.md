# Source semantics, configurable cutoff and remaining scoped tasks

Publication follow-up: code commit `8deeb6ef41b14a7ed96a52f3bd9e70f7bc2a0930` was subsequently pushed and verified. GitHub reported an externally completed rename to `pjijxgvh`; origin and current repository links were updated. Earlier uncommitted/manual-rename observations below describe the original review handoff.

Deployment, video recording/upload and form submission are intentionally deferred. This follow-up preserves the existing React/Python/Docker product and original Elexon data. No half-hour forecast observations have been manufactured.

## 1. Resolution and physical quantity

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

## 2. Decision cutoff

The assignment does not specify a clock time or exchange auction. [Nord Pool's GB Product Specifications, effective 10 July 2023](https://www.nordpoolgroup.com/4a3355/globalassets/download-center/rules-and-regulations/product-specifications-gb-valid-from-10-july-23.pdf), section 3.1, lists gate closure at 09:50 GMT/BST; section 1.2 defines UK-local time references. This is authoritative support for that published GB auction specification, not independent confirmation of the client's purchasing workflow, all GB auctions, or the exact rule version applicable in January 2026.

Keep 09:50 as the default project assumption, now configurable through `DECISION_CUTOFF_LOCAL` in strict HH:MM format. `backend/app/config.py` validates it; `Analysis` reads it when constructed and combines each decision date with Europe/London before converting to UTC. Only publishTime <= cutoff is eligible; choose the greatest eligible publication separately for each hourly delivery target. Changing the cutoff changes available forecasts and may change metrics and coverage. Publication time remains an availability proxy, without transmission-latency data.

January 1–31 purchasing decisions target January 2–February 1 delivery. January UK time equals UTC/GMT; aware input offsets normalize to UTC and naive inputs fail. The pilot still only supports this fixed January window, not arbitrary DST days.

Compose passes the optional root `.env` setting to the backend. Standalone Python requires a process environment variable; it does not implicitly load `.env`. Restart/recreate the API after changes because analysis is cached. `/api/coverage` returns `decisionCutoffLocal`; decision timestamps, CSV, overview labels and methodology use the same value. There is no per-request cutoff override and no new UI control.

## 3. Repository naming

During the review, the origin still used the old name and GitHub CLI was absent. During the subsequent authorized push, GitHub reported that the repository had moved to `https://github.com/SohamUser/pjijxgvh.git`. The local origin was updated and the new remote verified. The rename was performed externally; this agent did not rename or create a repository, initiate browser authentication, or extract credentials.

The suggested name **pjijxgvh** is now the verified repository name. The following earlier manual instructions are retained for reference; no further rename is needed:

1. Sign in to GitHub and open the existing repository → Settings → General → Repository name.
2. Rename `GidBricks` to `pjijxgvh` if available, otherwise another neutral random name. Preserve visibility and contents.
3. Run `git remote set-url origin https://github.com/SohamUser/pjijxgvh.git` only after the rename succeeds.
4. Verify with `git remote -v` and `git ls-remote origin refs/heads/main`.
5. Replace current repository URLs in README/docs, inspect the diff, and verify the renamed repository signed out. Do not blindly replace local directory paths, Docker project names or unrelated historical text.

## 4. Effort evidence

The repository contains eight commits at the start of this follow-up. The first is dated 25 October 2026 13:48:22 IST; the latest is 16:15:50 IST that day. The snapshot manifest records retrieval at 08:03:49 UTC (13:33:49 IST). These are event timestamps, not an active-work ledger; no actual effort is calculated from their spacing.

The submitter estimates **4–5 hours of total active work**, including earlier work outside this chat. This self-report is below 16 hours, but cannot be independently verified from Git or the manifest. Pauses, work before the first commit, offline work and subsequent effort are not measured. Confirm the final total after remaining work; do not describe the estimate as audited compliance.

## 5. Verification and remaining actions

New deterministic tests cover immediately before/exactly at/after cutoff; configurable cutoff and strict parsing; January-to-February rollover; missing half-hours; duplicate source records; preservation of publication timestamps; and the cancellation difference between hourly averaging and a hypothetical constant half-hour split. Existing metric, NaN/null/zero, revision and offline source-integrity checks remain in place.

Current results: 30 backend tests passed and one opt-in live integration test skipped; five frontend tests passed. TypeScript/production build, Ruff, Compose configuration and whitespace checks all passed with exit 0. `docker compose up --build -d` and the HTTP runtime smoke check passed with exit 0; both services were healthy. The live schema was fetched; the 69 historical responses were inspected as saved fixtures, not re-downloaded. No observations were refreshed.

A separate local API/frontend pair on ports 8012/5174 was started with cutoff 08:00. Browser checks verified API metadata 08:00, decision cutoff 08:00Z, selected publication 07:30Z for the January 15 decision, and matching overview/footer/methodology labels. Estimated-energy labeling and the unconfirmed interval-average caveat were visible. These test servers were stopped; the normal Docker app retains default 09:50. No production setting changed.

`git ls-remote origin refs/heads/main` verified the existing remote branch at `512589e7d9657539108d2be327cca93cc57994fb`; no rename, commit or push occurred in this follow-up. A targeted tracked-file secret-pattern scan found no common private-key/token patterns, and only `.env.example` is tracked among checked environment paths. No source data or credentials were added; no new commits were made. This is not an exhaustive historical secret audit.

Commands: `.venv/Scripts/python -B -m unittest discover -s backend/tests -t backend -v`, `npm --prefix frontend test`, `npm --prefix frontend run build`, `.venv/Scripts/python -B -m ruff check --no-cache backend/app backend/tests api`, `docker compose config --quiet`, `docker compose up --build -d`, and `.venv/Scripts/python -B -m backend.tests.runtime_smoke --base-url http://localhost:8000`.

## 6. Files inspected and changed

Inspected: the above official sources and live schema; committed snapshot/manifest/raw fixtures; Git history/remotes/status; source services and response models; API routes; React views/types/API client; automated tests; package/dependency files; Dockerfiles/Compose; `.env.example`; README and readiness/demo/analysis documents. The worktree was initially clean, so no unrelated user edits needed merging.

Modified files:

- Backend: `backend/app/config.py`, `backend/app/services/forecast_selection.py`, `backend/app/api/routes.py`, `backend/app/schemas/responses.py`.
- Frontend: `frontend/src/App.tsx`, `frontend/src/pages/DecisionView.tsx`, `frontend/src/pages/MethodologyView.tsx`, `frontend/src/types/index.ts`.
- Tests/configuration: `backend/tests/test_analysis.py`, `backend/tests/test_api.py`, `docker-compose.yml`, `.env.example`.
- Documentation: `README.md`, `docs/analysis.md`, `docs/architecture.md`, `docs/demo-script.md`, `docs/pipeline-review.md`, `docs/submission-checklist.md`, `docs/submission-readiness.md`; added `docs/source-semantics.md`.

No numerical source files, dependency lists, unrelated UI styles, deployment settings or repository identity were changed. Changes are local and uncommitted at handoff.

Active unresolved items excluding deferred deliverables: confirm forecast interval semantics/half-hour mapping; agree the client's actual cutoff; complete the manual anonymous rename and URL updates; review/commit/push this follow-up if desired; confirm the final self-reported effort total. Deployment, video and form remain deliberately untouched.
