import type { Coverage } from "./types";

export default function MethodologyView({
  coverage,
}: {
  coverage: Coverage | null;
}) {
  return (
    <section className="methodology">
      <article className="panel">
        <div className="section-kicker">01 · DECISION REPLAY</div>
        <h2>What could the trader have known?</h2>
        <p>
          For each January 1–31 purchase decision, select the latest WINDFOR
          publication at or before 09:50 Europe/London for each hour of the next
          calendar day. Delivery spans January 2–February 1. All dates in this
          window use GMT.
        </p>
        <p>
          Selection is per target hour. A later forecast is never used to fill a
          gap in the decision-time outlook. Publication time is our availability
          proxy; source transmission latency is not available.
        </p>
      </article>
      <article className="panel">
        <div className="section-kicker">02 · COMPARABLE INTERVALS</div>
        <h2>Hourly forecasts, half-hourly outturn</h2>
        <p>
          The January WINDFOR snapshot contains hourly values. Each is compared
          with the mean of the two FUELHH WIND half-hours starting at that hour.
          Both actual half-hours are required. The application does not
          interpolate forecasts.
        </p>
        <p>
          Generation is average power in MW. Each aligned interval lasts one
          hour, so summing hourly MW gives MWh. Divide by 1,000 for GWh.
          Incomplete-day totals are partial.
        </p>
      </article>
      <article className="panel">
        <div className="section-kicker">03 · ERROR DEFINITIONS</div>
        <h2>Measured error, clearly defined</h2>
        <p>
          Error = forecast − actual. Positive bias means wind was overestimated;
          negative bias means it was underestimated. MAE averages absolute
          errors. RMSE is the square root of the mean squared error. P90 uses
          the nearest-rank 90th percentile of absolute errors.
        </p>
        <p>
          Monthly metrics use every matched hourly pair, not the average of
          daily scores. Missing pairs are excluded and coverage is shown.
          Actuals use the latest publication retrieved; they are retrospective
          outturn, not an as-of actuals replay.
        </p>
      </article>
      <article className="panel">
        <div className="section-kicker">04 · SOURCE & LIMITATIONS</div>
        <h2>A focused national pilot</h2>
        <p>
          Only Elexon WINDFOR and FUELHH WIND are used. These represent Elexon’s
          reported Great Britain wind coverage, not every UK wind installation
          or the client’s contracted renewable portfolio. No demand, price,
          weather, or portfolio data is included, so this app cannot calculate a
          utility’s purchase requirement or financial benefit.
        </p>
        <p>
          Snapshot retrieved:{" "}
          <strong>
            {coverage
              ? new Date(coverage.retrievedAt).toLocaleString("en-GB", {
                  timeZone: "Europe/London",
                }) + " UK time"
              : "—"}
          </strong>
          . Matched hours:{" "}
          <strong>
            {coverage?.matchedHours}/{coverage?.expectedHours}
          </strong>
          . Raw responses, request URLs, and SHA-256 checksums accompany the
          repository.
        </p>
        <div className="source-links">
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
            target="_blank"
            rel="noreferrer"
          >
            WINDFOR documentation ↗
          </a>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
            target="_blank"
            rel="noreferrer"
          >
            FUELHH documentation ↗
          </a>
        </div>
      </article>
    </section>
  );
}
