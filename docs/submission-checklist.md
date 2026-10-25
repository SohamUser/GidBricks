# Final submission checklist

Status: **not ready to submit**. Checkboxes record verified completion, not planned work.

Current scope explicitly defers deployment, video recording/upload and the form. They remain unchecked below but are not active blockers for this scoped follow-up. Latest methodology, test and effort evidence: [source-semantics.md](source-semantics.md).

## Links and access

- Repository: https://github.com/SohamUser/pjijxgvh — GitHub reported the existing repository's move to this random name; local origin and remote code commit were verified. Reopen the final renamed URL signed out before submission.
- Application: **deferred**; no verified public URL. See `deployment.md`.
- Video: **deferred**; no verified YouTube URL.
- Submission form: https://forms.cloud.microsoft/r/FTX6K2bbnU — **deferred**; no submission performed.

## Required gates

- [x] Public repository can be opened without signing in.
- [x] Repository uses random name `pjijxgvh`; GitHub reported the move and the new remote was verified.
- [ ] Resolve the hourly-output adaptation against the assignment's half-hour requirement, or obtain explicit acceptance of the limitation.
- [x] Verify source cadence and MW units; retain conditional hourly analysis because reliable half-hour forecast mapping is not established.
- [x] Make cutoff configurable, preserve default 09:50, and test boundary eligibility and UI/API metadata.
- [x] Reviewed source, tests and readiness documentation committed on `main` in `b18a5937e341e06b541a20360ceeee067f21efbf`.
- [x] Code commit pushed; remote `main` SHA verified as `b18a5937e341e06b541a20360ceeee067f21efbf` before this documentation follow-up.
- [x] Source-semantics/configurable-cutoff follow-up committed and pushed as `8deeb6ef41b14a7ed96a52f3bd9e70f7bc2a0930`; remote SHA verified.
- [ ] Deployed frontend and Python backend work on Vercel or Heroku.
- [ ] Real Elexon-derived forecasts, actuals and metrics load in the public app.
- [x] Docker setup built without cached application layers and started successfully during QA; services are currently healthy.
- [x] README contains purpose, dashboard description, architecture/data flow, structure, setup, environment placeholders, tests, sources, formulas, AI disclosure and limits.
- [ ] README includes the actual verified live URL and final video URL; pending text is not a substitute for these deliverables.
- [x] Automated tests rerun: 30 backend passed, one live test skipped by default; five frontend tests passed.
- [ ] Unlisted YouTube video recorded, uploaded and processed.
- [ ] Client presentation measured at no more than five minutes.
- [ ] Technical explanation measured at no more than five minutes.
- [ ] Entire final video measured at no more than ten minutes.
- [ ] Repository final revision reopened in incognito after push/rename.
- [ ] Public app and API tested in incognito, including January 31, actual overlay, accuracy and export.
- [ ] Final YouTube URL plays in incognito without requiring account access.
- [x] Submitter supplied an estimate of 4–5 active hours; recorded as self-reported, not independently verified.
- [ ] Confirm final total effort remains within 16 hours after remaining work; no verified time ledger is present.
- [ ] Submit all actual verified links and requested details through the form, only after the video is ready.
- [ ] Verify and retain form-submission confirmation.

## Manual completion order

1. Resolve cadence acceptance and agree the assumed 09:50 UK cutoff before claiming analytical compliance.
2. Rename the GitHub repository if needed under Settings → Repository name. Update the origin and every repository link in README/docs; leave local directory names unchanged.
3. Review `git status --short` and `git diff`. Stage source/tests/docs explicitly, commit on `main`, push, and verify the final public revision. Do not include `.env`, credentials or local build outputs.
4. Following separately approved deployment, use `deployment.md`; keep the repository root as the Vercel root and use the checked-in configuration. No production settings were changed during review.
5. Run `.venv/Scripts/python -B -m backend.tests.runtime_smoke --base-url <ACTUAL_PUBLIC_ORIGIN>` and check the app signed out. Replace the placeholder with the deployed origin; do not submit this placeholder.
6. Add the verified app URL to README and this checklist, commit/push it, and ensure the deployed source revision is current.
7. Rehearse and record `demo-script.md`, measure both parts and total duration, upload as Unlisted, and verify playback signed out.
8. Add the actual video URL, commit/push the final documentation and reopen every final link in incognito.
9. Submit the form and retain confirmation. Do not submit without the video.

The submitter owns account actions, recording/upload and final form submission. The readiness review performed no publishing actions. In a subsequent explicitly authorized follow-up, code commit `b18a5937e341e06b541a20360ceeee067f21efbf` was committed, pushed and verified on remote `main`. Repository rename, deployment, video upload and form submission remain pending.
