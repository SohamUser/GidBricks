import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Coverage } from "../types";

export default function MethodologyView({
  coverage,
}: {
  coverage: Coverage | null;
}) {
  return (
    <section className="methodology">
      <div className="methodology-grid">
        <article>
          <h2>Replay the original purchase decision</h2>
          <p>
            For each January 1–31 decision, select the latest WINDFOR
            publication at or before {coverage?.decisionCutoffLocal ?? "the configured cutoff"} Europe/London for every hour of the
            next calendar day. Delivery spans January 2–February 1. All dates in
            this window use GMT. The cutoff is a configurable project assumption,
            not a deadline specified in the assignment.
          </p>
          <p>
            Selection is per target hour. Later publications never fill
            decision-time gaps. Publication time is an availability proxy;
            source transmission latency is not available.
          </p>
        </article>
        <article>
          <h2>Compare matching delivery intervals</h2>
          <p>
            January WINDFOR contains hourly values. Each forecast is compared
            with the mean of FUELHH WIND at the hour and the following
            half-hour. Both actual halves are required; forecasts are not
            interpolated.
          </p>
          <p>
            FUELHH is average power in MW; WINDFOR is an hourly MW forecast whose
            interval-average definition is not established by the inspected documentation.
            The comparison assumes each forecast represents its target hour.
            Estimated energy uses MW × 1 hour; this assumption needs confirmation.
            Incomplete-day energy totals are labeled partial. Forecasts are not
            duplicated into half-hours because their within-hour shape is unknown.
          </p>
        </article>
        <article>
          <h2>Interpret the error consistently</h2>
          <p>
            Error = forecast − actual. Positive bias means wind was
            overestimated. MAE averages absolute errors; RMSE is the square root
            of mean squared error. P90 is the nearest-rank 90th percentile of
            absolute error.
          </p>
          <p>
            Monthly metrics use all matched hourly pairs, not the average daily
            score. Missing pairs are excluded with coverage shown. Actuals use
            the latest retrieved publication and are retrospective outturn.
          </p>
        </article>
        <article>
          <h2>Understand the pilot’s limits</h2>
          <p>
            Only Elexon WINDFOR and FUELHH WIND are used. Their Great Britain
            coverage does not represent every UK installation or the client’s
            contracted portfolio. Differences in coverage can contribute to the
            measured gap.
          </p>
          <p>
            Demand, prices, other fuels and existing positions are outside this
            pilot. It cannot calculate a utility’s purchase volume or savings.
            January error statistics are retrospective, not future confidence
            intervals.
          </p>
        </article>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Snapshot and source documentation</h2>
          </CardTitle>
          <CardDescription>
            The repository includes original responses, request URLs and SHA-256
            checksums.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="snapshot-facts">
            <div>
              <dt>Snapshot retrieved</dt>
              <dd>
                {coverage
                  ? new Date(coverage.retrievedAt).toLocaleString("en-GB", {
                      timeZone: "Europe/London",
                    }) + " UK time"
                  : "Unavailable"}
              </dd>
            </div>
            <div>
              <dt>Matched delivery hours</dt>
              <dd>
                {coverage?.matchedHours ?? "—"} /{" "}
                {coverage?.expectedHours ?? "—"}
              </dd>
            </div>
          </dl>
          <div className="source-links">
            <Button variant="outline" asChild>
              <a
                href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
                target="_blank"
                rel="noreferrer"
              >
                WINDFOR API documentation
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
                target="_blank"
                rel="noreferrer"
              >
                FUELHH API documentation
              </a>
            </Button>
            <Button variant="link" asChild>
              <a href="/api/docs" target="_blank" rel="noreferrer">
                Application API reference
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
