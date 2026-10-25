# January 2026 analysis

The replay uses January 1–31 purchase decisions at 09:50 GMT, for January 2–February 1 delivery. Each hour uses the latest publication available by the cutoff. Actuals are the mean of the two FUELHH WIND half-hours.

## Findings from the bundled snapshot

- Complete coverage: 744/744 selected forecast hours and matched outcomes.
- Mean absolute error: **2,013.01 MW**.
- Root mean squared error: **2,505.94 MW**.
- Mean signed error: **+1,729.93 MW**, using forecast minus actual.
- Nearest-rank P90 absolute error: **4,145.50 MW**.
- MAPE: **21.6102%**, using **744 nonzero matched hourly actuals**, with **0 excluded hours**. See `pipeline-review.md` for the exclusion policy and hourly-alignment limitation.
- Largest daily MAE: **January 27 decision**, January 28 delivery, **5,374.79 MW**.
- Other large misses: January 11 decision, **4,900.88 MW**; January 10 decision, **4,897.10 MW**.
- Smallest daily MAE: **January 8 decision**, January 9 delivery, **797.06 MW**.
- Illustrative January 15 decision: forecast energy **191.402 GWh**, peak **10,850 MW**, minimum **5,881 MW**; delivery January 16. Verify exact energy against the API before narration if data is refreshed.

## Meaning for the client

Overestimating available wind can leave more energy to procure than expected. This pilot makes that direction and historical magnitude visible. It does not establish the utility’s exposure: demand, contracted renewable share and existing hedges are absent.

The strong positive bias is a prompt to investigate comparability, not proof of a faulty forecasting model. WINDFOR and FUELHH are the required source series, but their measured populations and methods can differ. The reported metrics quantify their observed difference after the stated temporal alignment.

Monthly P90 is calculated retrospectively from all January decisions. It must not be presented as a reserve that was known on January 1, as a 90% future guarantee, or as an independently validated confidence interval. With only 31 correlated delivery days, observations are not independent evidence of long-term performance.

The API and charts retain MW units. Daily forecast energy integrates 24 one-hour intervals; no multiplication by 0.5 is applied after hourly aggregation. Missing halves invalidate that hour’s actual comparison.
