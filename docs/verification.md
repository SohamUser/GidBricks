# Verification record

Verified on October 25, 2026 against the bundled Elexon snapshot.

| Check | Result |
| --- | --- |
| Analytical and API suite | 8 tests passed |
| Real-data coverage | 744/744 hourly pairs, all 31 decision days |
| No-lookahead | Every selected publication is at/before its decision cutoff |
| Month-end | January 31 decision maps to February 1 delivery |
| CSV | One decision exports 24 records plus header |
| Frontend | Strict TypeScript check and Vite production build passed |
| Dependency audit | `npm audit`: zero known vulnerabilities after Vite update |
| Browser data flow | Local browser → FastAPI → snapshot → charts and metrics verified |
| UI interactions | Actual overlay, accuracy navigation, CSV and responsive layout checked |
| Mobile | 390px viewport, no document horizontal overflow |
| Compose | `docker compose config --quiet` passed |
| Container execution | Not verified: Docker Linux engine unavailable |
| Production deployment | Not completed: Vercel 403; CLI not signed in; user requested instructions |
| Video and submission | User-owned; pending |

The production build emits a bundle-size advisory: the charting-inclusive JavaScript bundle is approximately 563 KB before compression, 172 KB gzip. This small pilot uses one charting library and no additional framework. Build succeeds; no performance claim is made beyond local functional verification.

The installed Starlette test client emits an httpx deprecation warning, but all tests pass. This is a tooling warning, not an application error.
