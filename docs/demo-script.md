# Recording guide — target 9 minutes

Record the browser at approximately 1440×900, hide unrelated tabs, and rehearse once. Use the deployed public app. Do not display authentication settings or credentials. The first part is a client pitch; the second is an internal technical review. Keep each below five minutes and the full recording below ten.

## Part 1 — Client presentation (0:00–4:30)

### 0:00–0:35 — Outcome

**Screen:** Decision overview, January 15, actual overlay off.

“Wind Desk answers two practical questions before a day-ahead purchase: what wind forecast was available at the decision time, and how large have its errors been? This January pilot brings the outlook, publication provenance and measured outcomes into a single view. We use only the two requested Elexon sources.”

### 0:35–1:30 — Decision replay

**Screen:** Point to decision date, 09:50 cutoff, January 16 delivery, energy cards and forecast line.

“We are replaying a January 15 decision for January 16 delivery. The cutoff is 09:50 UK time, our N2EX pilot convention. Each delivery hour takes the most recently published eligible forecast. The publication panel shows exactly when it was issued. Forecast coverage is complete. This gives the desk a traceable wind outlook without accidentally using a later forecast.”

“The energy total summarizes the full day, while minimum and peak output show the shape that a daily total alone would hide. These are national reported wind quantities; they are not the client’s contracted supply.”

### 1:30–2:15 — Outcome inspection

**Screen:** Enable actuals; expand hourly values.

“We deliberately separate the decision view from hindsight. Turning on actuals shows what subsequently happened. We can inspect every selected value and its publication timestamp, or export the same analysis for an audit. January’s forecasts are hourly; actual half-hours are averaged into matching hours.”

### 2:15–3:30 — Quantify uncertainty

**Screen:** Forecast accuracy, full January range; hover daily bars and open January 27 from the ranked list.

“Across 744 matched hours, mean absolute error is about 2,013 MW. RMSE is about 2,506 MW, highlighting larger misses. Bias is positive by about 1,730 MW: the forecast generally exceeded the reported actual series. Ninety percent of observed absolute errors were at or below about 4,146 MW.”

“January 27 was the largest daily miss. Clicking it takes us straight to the underlying outlook and outcome. This makes exceptions investigable rather than leaving the trader with a single monthly score.”

### 3:30–4:30 — Value and boundaries

**Screen:** Methodology, then return to overview.

“These results quantify the gap between the specified Elexon datasets. Differences in coverage may contribute, so we should not attribute every gap to weather forecasting. The monthly results are retrospective, not a future guarantee or a reserve recommendation. To size your actual purchase we would next need demand, contracted supply and existing positions. This pilot establishes the reliable foundation: a time-correct outlook, visible provenance and measurable error.”

## Part 2 — Technical review (4:30–9:00)

### 4:30–5:15 — Architecture

**Screen:** `docs/architecture.md` diagram and repository tree.

“The implementation has a React/TypeScript frontend and a small FastAPI backend. An offline Python command downloads the two Elexon streams. The repository retains raw responses and a manifest of URLs and checksums. The runtime reads a bundled snapshot, so the demo remains usable when Elexon is unavailable. There is no database or scheduler because this is a fixed historical month.”

### 5:15–6:30 — Analytical correctness

**Screen:** `backend/analysis.py`, selection loop and hourly actual pair.

“Forecast selection is per target hour, constrained by publication time at or before the original decision cutoff. We verified the real response cadence: WINDFOR is hourly. FUELHH is half-hourly, so both halves are required and averaged. Missing observations stay missing. Energy is the sum of hourly average MW over one-hour intervals. Actuals use the latest retrieved publication; identical duplicates collapse and conflicting values at the same publication fail visibly.”

“The date range follows purchase decisions, so January 31 correctly includes February 1 delivery. MAE, RMSE, signed bias and nearest-rank P90 are computed in Python. Monthly aggregation uses all hourly pairs rather than averaging daily metrics.”

### 6:30–7:25 — Code and API

**Screen:** `backend/main.py`, frontend view files, browser network or `/api/decision`.

“The API exposes decisions, accuracy, coverage and CSV. Dates are validated at the boundary. The analytical module is independent of FastAPI, making the important rules easy to test. The frontend has separate decision, accuracy and methodology views with typed response shapes. Requests are parallel and obsolete requests are aborted. CSV uses the same backend calculation path as the UI.”

### 7:25–8:20 — Verification and packaging

**Screen:** Run tests and show Dockerfile and Vercel config.

“Eight focused tests cover cutoff inclusion and exclusion, missing data, averaging, revisions, duplicate conflicts, formulas, aggregation, date validation and export. Integration tests assert all 744 real-data pairs and check every selected publication against its cutoff. The frontend passes TypeScript and its production build. The dependency audit is clear. Docker builds React in one stage and runs FastAPI as a non-root user in the final image. Vercel hosts static assets and the Python API.”

**Recording note:** Describe Docker execution only if it has actually been run successfully; otherwise state that its engine was unavailable during the initial verification.

### 8:20–9:00 — Maintainability and handoff

**Screen:** README startup, analysis limits and AI disclosure.

“The README contains startup commands, structure, data refresh, formulas and limitations. Codex assisted with the implementation and verification; the numerical dataset is entirely Elexon data. The main next steps are agreeing source coverage and portfolio inputs before adding procurement sizing, then collecting a longer chronological evaluation before recommending uncertainty reserves. The pilot keeps those extensions out of the current code.”

## Upload and access check

Upload the completed recording to YouTube with **Unlisted** visibility, wait for processing, and open the URL while signed out or in incognito. Ensure audio, screen text and both sections are understandable. Add the link to README and the submission checklist before submitting.
