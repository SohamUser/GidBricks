# Final submission checklist

Status: **not ready to submit**. Checkboxes record verified completion, not planned work.

## Links and access

- Repository: https://github.com/SohamUser/GidBricks — verified public in a fresh isolated signed-out browser session. Random anonymous naming remains unresolved.
- Application: pending deployment; no verified public URL. See `deployment.md`.
- Video: pending recording and unlisted upload; no verified YouTube URL.
- Submission form: https://forms.cloud.microsoft/r/FTX6K2bbnU — submission not performed or verified.

## Required gates

- [x] Public repository can be opened without signing in.
- [ ] Repository uses an anonymous name accepted for the assignment; a random name is recommended.
- [ ] Resolve the hourly-output adaptation against the assignment's half-hour requirement, or obtain explicit acceptance of the limitation.
- [x] Reviewed source, tests and readiness documentation committed on `main` in `b18a5937e341e06b541a20360ceeee067f21efbf`.
- [x] Code commit pushed; remote `main` SHA verified as `b18a5937e341e06b541a20360ceeee067f21efbf` before this documentation follow-up.
- [ ] Deployed frontend and Python backend work on Vercel or Heroku.
- [ ] Real Elexon-derived forecasts, actuals and metrics load in the public app.
- [x] Docker setup built without cached application layers and started successfully during QA; services are currently healthy.
- [x] README contains purpose, dashboard description, architecture/data flow, structure, setup, environment placeholders, tests, sources, formulas, AI disclosure and limits.
- [ ] README includes the actual verified live URL and final video URL; pending text is not a substitute for these deliverables.
- [x] Automated tests rerun: 26 backend passed, one live test skipped by default; five frontend tests passed.
- [ ] Unlisted YouTube video recorded, uploaded and processed.
- [ ] Client presentation measured at no more than five minutes.
- [ ] Technical explanation measured at no more than five minutes.
- [ ] Entire final video measured at no more than ten minutes.
- [ ] Repository final revision reopened in incognito after push/rename.
- [ ] Public app and API tested in incognito, including January 31, actual overlay, accuracy and export.
- [ ] Final YouTube URL plays in incognito without requiring account access.
- [ ] Confirm total development effort satisfies the 16-hour cap; no verified effort ledger is present.
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
