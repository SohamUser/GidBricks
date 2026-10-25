# Verification record

Verified on October 25, 2026 against the bundled Elexon snapshot.

| Check | Result |
| --- | --- |
| Analytical and API suite | 9 tests passed |
| Real-data coverage | 744/744 hourly pairs, all 31 decision days |
| Raw provenance | All 69 raw-response SHA-256 checksums match the manifest |
| No-lookahead | Every selected publication is at/before its decision cutoff |
| Month-end | January 31 decision maps to February 1 delivery |
| CSV | One decision exports 24 records plus header |
| Frontend | Strict TypeScript check and Vite production build passed |
| Dependency audit | `npm audit`: zero known vulnerabilities after Vite update |
| Browser data flow | Local browser → FastAPI → snapshot → charts and metrics verified |
| UI interactions | shadcn switch, date fields, hourly table, accuracy navigation, CSV and keyboard tabs checked |
| Mobile | 390px viewport, overview, accuracy and methodology fit without document horizontal overflow |
| Drill-down | January 27 ranked miss opens January 28 delivery with actuals enabled |
| Public repository access | README and code visible in an isolated signed-out browser context |
| API documentation | `/api/docs` and `/api/openapi.json` return 200; schema exposes all five data endpoints |
| Date-range filter | January 15–31 renders 408/408 matched hours and updates CSV range |
| Error recovery | Out-of-window date shows the API validation message and removes stale cards; selecting a valid date restores data |
| Browser console | Fresh production-container page has no unexpected console warnings or errors |
| Container identity | `uid=1000(appuser)`; runtime is non-root |
| Theme and typography | Navy/teal/amber semantic tokens; local Source Sans 3 fonts; no header logo icon |
| Compose | `docker compose config --quiet` passed |
| Container execution | Passed: image built, non-root container healthy, UI and API served on port 8000 |
| Production deployment | Not completed: Vercel 403; CLI not signed in; user requested instructions |
| Video and submission | User-owned; pending |

The production build emits a bundle-size advisory: the charting-inclusive JavaScript bundle is approximately 635 KB before compression, 197 KB gzip. This small pilot uses Recharts and official shadcn/Radix controls. Build succeeds; no performance claim is made beyond local functional verification.

The installed Starlette test client emits an httpx deprecation warning, but all tests pass. This is a tooling warning, not an application error.
