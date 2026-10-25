# Video outline — target 9 minutes, maximum 10

Status: script prepared; no recording, upload or video URL has been verified. Rehearse locally, but record the final demonstration against the verified public deployment. Show readable text, hide unrelated tabs, and never show credentials.

## Part 1 — Client presentation, 0:00–4:30

| Time | Screen/action | Suggested narration |
| --- | --- | --- |
| 0:00–0:35 | Decision overview, January 15, actuals off | “Wind availability affects how much electricity the desk must procure. Wind Desk replays the forecast available at a historical purchase cutoff and makes its measured error visible.” |
| 0:35–1:30 | Date, next-day delivery, coverage, publication panel | “This January 15 decision targets January 16 delivery. We assume a 09:50 UK cutoff; it needs agreement with the desk. Each target uses the latest forecast published by that cutoff. The publication time makes the outlook traceable.” Point out the energy, peak and minimum cards. |
| 1:30–2:15 | Enable actual overlay; expand interval table | “Actuals are retrospective. The chart and table show what happened alongside the forecast, with publication timestamps. January WINDFOR is hourly; this pilot compares it with averaged actual half-hours.” Demonstrate CSV export. |
| 2:15–3:30 | Accuracy, full January range; daily bars; January 27 drill-down | “Across 744 matched hours, MAE is about 2,013 MW, RMSE 2,506 MW and bias +1,730 MW. Positive bias means wind was overestimated. P90 absolute error is about 4,146 MW.” Filter a date range and inspect the largest daily miss. The API also reports MAPE 21.61%, with 744 included and zero excluded hours; do not imply it has its own dashboard card. |
| 3:30–4:30 | Methodology; return to overview | “These are differences between the two specified national Elexon series. They are historical observations, not future confidence bounds. Demand, contracted supply and existing positions are needed to size a purchase. The hourly adaptation can hide opposite half-hour errors, so half-hour mapping remains to be agreed.” Close with provenance, visible uncertainty and auditable exceptions as the pilot's value. |

## Part 2 — Technical review, 4:30–9:00

| Time | Screen/action | Suggested narration |
| --- | --- | --- |
| 4:30–5:15 | Architecture diagram and directory tree | “React/TypeScript owns presentation. FastAPI owns the API, while Python services own ingestion, historical selection and scoring. Frontend and backend have independent dependencies and Dockerfiles. A bundled snapshot keeps the fixed historical pilot deterministic.” |
| 5:15–6:00 | `backend/app/services/elexon_client.py`, manifest | “Only WINDFOR and FUELHH WIND are used. Daily requests use publication filters for forecasts and settlement dates for actuals. JSON arrays, records and coverage are validated. Timeouts, retries and interrupted reads are handled. Raw responses and hashes preserve provenance.” Explain that valid upstream omissions cannot always be proven absent. |
| 6:00–6:50 | `forecast_selection.py`, selection and matching | “Aware timestamps normalize to UTC. Per delivery target, choose maximum publishTime at or before the assumed cutoff. Join actuals by startTime, never publication time. January 31 includes February 1 delivery. Identical revisions collapse; conflicts fail. Null latest values stay missing.” Show hourly averaging explicitly. |
| 6:50–7:40 | `accuracy.py`, focused tests and API schema | “Error is forecast minus actual. Python computes MAE, RMSE, mean bias, nearest-rank P90 and MAPE. MAPE excludes zero actuals and missing pairs, with counts disclosed. Monthly metrics pool observations rather than averaging daily means.” Show the current results: 26 offline backend tests passed, one live test skipped by default, and five frontend tests passed. The separate opt-in live check previously passed four requests; avoid claiming a full live re-download. |
| 7:40–8:25 | Docker Compose, healthy services, API health, Vercel configuration | “Docker builds a non-root Nginx frontend and FastAPI backend. Same-origin API proxying works locally; Vite's upstream is configurable. The endpoint smoke check validates schemas, dates, errors and CSV over HTTP.” Show public deployment only after verifying it; configuration alone does not establish cloud operation. |
| 8:25–9:00 | README, limitations and AI disclosure | “Codex assisted with research, implementation, tests and documentation. Numerical observations come from Elexon. Key limits are hourly alignment, the assumed cutoff, source comparability and descriptive error estimates. Snapshot replacement is atomic per file, not across the whole data set.” Explain startup and refresh handoff briefly. |

## Recording and upload checks

- Recheck displayed numbers against the current API before narration; do not read stale figures after refreshing data.
- Keep client section at or below 5:00, technical section at or below 5:00, and the entire recording at or below 10:00. Target 4:30 + 4:30 leaves one minute of headroom.
- Measure the actual final edit; the outline's timing is not proof of recorded duration.
- Upload to YouTube as Unlisted and wait for processing. Verify audio, readable code, both sections and playback in an incognito window.
- Add the verified URL to README and the submission checklist. No video URL is currently available.

Actual client duration: pending. Actual technical duration: pending. Actual total duration: pending. Unlisted playback verification: pending.
