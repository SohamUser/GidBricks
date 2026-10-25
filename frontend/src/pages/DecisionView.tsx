import {
  Area,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { number, shortDate, tooltipStyle } from "../lib/presentation";
import { Metric, ErrorMetrics } from "../components/Metric";
import type { Decision } from "../types";

export default function DecisionView({
  decision,
  actuals,
  setActuals,
  date,
  onAccuracy,
}: {
  decision: Decision;
  actuals: boolean;
  setActuals: (value: boolean) => void;
  date: string;
  onAccuracy: () => void;
}) {
  const publications = [
    ...new Set(
      decision.points
        .map((p) => p.publishTime)
        .filter((p): p is string => p !== null),
    ),
  ];
  const ages = decision.points.flatMap((p) =>
    p.ageHours === null ? [] : [p.ageHours],
  );
  const maxAge = ages.length ? Math.max(...ages) : null;
  const cutoffTime = new Date(decision.cutoff).toLocaleTimeString("en-GB", {
    timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false,
  });

  return (
    <>
      {decision.forecastHours === 0 && (
        <Alert>
          <AlertTitle>No eligible wind forecasts</AlertTitle>
          <AlertDescription>
            No usable forecasts were published by this decision cutoff. Select another decision date.
          </AlertDescription>
        </Alert>
      )}
      <div className="metrics" aria-label="Delivery-day forecast summary">
        <Metric
          label="Estimated forecast wind energy"
          value={
            decision.forecastEnergyMwh === null
              ? null
              : decision.forecastEnergyMwh / 1000
          }
          unit="GWh"
          detail={
            decision.forecastHours === 24
              ? "Assumes forecast MW represents each hour"
              : `Partial total across ${decision.forecastHours} hours`
          }
        />
        <Metric
          label="Peak generation"
          value={decision.peakMw}
          unit="MW"
          detail="Highest hourly forecast"
        />
        <Metric
          label="Minimum generation"
          value={decision.minMw}
          unit="MW"
          detail="Lowest hourly forecast"
        />
        <Metric
          label="Forecast coverage"
          value={decision.forecastHours}
          unit="/ 24 hours"
          detail={
            decision.forecastHours === 24
              ? "Complete delivery-day outlook"
              : "Some forecasts are missing"
          }
        />
      </div>

      <Card className="forecast-panel">
        <CardHeader>
          <CardTitle>
            <h2>Hourly wind profile</h2>
          </CardTitle>
          <CardDescription>
            Delivery {shortDate(decision.deliveryDate)} 2026. Power in MW,
            shown in GMT. Forecasts are assumed representative of each hour.
          </CardDescription>
          <CardAction>
            <div className="actuals-control">
              <Field orientation="horizontal">
                <Switch
                  id="actuals-overlay"
                  checked={actuals}
                  onCheckedChange={setActuals}
                />
                <FieldLabel htmlFor="actuals-overlay">Show actuals</FieldLabel>
              </Field>
              <Badge variant="secondary">Retrospective</Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="chart-legend">
            <span>
              <i className="legend-line" />
              Forecast at cutoff
            </span>
            {actuals && (
              <span>
                <i className="legend-line actual" />
                Actual hourly mean
              </span>
            )}
            <span className="chart-caption">1-hour intervals</span>
          </div>
          <div
            className="main-chart"
            role="img"
            aria-label="Hourly forecast and optional actuals. All values are available in the table below."
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 800, height: 305 }}
            >
              <ComposedChart
                data={decision.points}
                margin={{ top: 12, right: 16, left: 0, bottom: 12 }}
              >
                <defs>
                  <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--forecast)"
                      stopOpacity={0.13}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--forecast)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--border)"
                  vertical={false}
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  interval={3}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => number(v)}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(value) => `Delivery ${value} GMT`}
                  formatter={(value) => `${number(Number(value), 1)} MW`}
                />
                <Area
                  type="stepAfter"
                  dataKey="forecastMw"
                  name="Forecast"
                  stroke="var(--forecast)"
                  strokeWidth={2.5}
                  fill="url(#windFill)"
                  isAnimationActive={false}
                />
                {actuals && (
                  <Line
                    type="stepAfter"
                    dataKey="actualMw"
                    name="Actual"
                    stroke="var(--actual)"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 4"
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter className="chart-footer">
          <span>Forecasts published by {shortDate(date)}, {cutoffTime} GMT.</span>
          <span>
            {actuals ? "Elexon WINDFOR + FUELHH WIND" : "Elexon WINDFOR"}
          </span>
        </CardFooter>
      </Card>

      <div className="bottom-grid">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Publication provenance</h2>
            </CardTitle>
            <CardDescription>
              The forecast actually available at purchase time.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">
                {publications.length} publication
                {publications.length === 1 ? "" : "s"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl className="provenance-list">
              <div>
                <dt>Published</dt>
                <dd>
                  {publications.length
                    ? publications.map((p) => (
                        <span key={p}>
                          {new Date(p).toLocaleString("en-GB", {
                            timeZone: "Europe/London",
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          GMT
                          <br />
                        </span>
                      ))
                    : "No eligible forecast"}
                </dd>
              </div>
              <div>
                <dt>Oldest forecast at cutoff</dt>
                <dd>{number(maxAge, 2)} hours</dd>
              </div>
              <div>
                <dt>Selection rule</dt>
                <dd>Latest publication at or before {cutoffTime}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Use the outlook with its uncertainty</h2>
            </CardTitle>
            <CardDescription>
              National wind forecasts are one input to a purchase decision.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="context-copy">
              Compare this outlook with January’s measured errors. The pilot
              shows the historical gap; portfolio demand and existing contracts
              are needed to size a purchase.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" onClick={onAccuracy}>
              Review forecast accuracy
            </Button>
          </CardFooter>
        </Card>
      </div>

      {actuals && (
        <section className="retrospective-section">
          <div className="section-title">
            <h2>Delivery-day outcome</h2>
            <Badge variant="secondary">
              {decision.metrics.count} / 24 matched hours
            </Badge>
          </div>
          <p className="section-description">
            Actuals below are retrospective and were not available at the
            purchase cutoff.
          </p>
          <ErrorMetrics metrics={decision.metrics} />
        </section>
      )}

      <details className="interval-table">
        <summary>Hourly values and publication times</summary>
        <Table>
          <TableCaption>
            Delivery {shortDate(decision.deliveryDate)} 2026. Error is forecast
            minus actual.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Delivery hour (GMT)</TableHead>
              <TableHead>Forecast MW</TableHead>
              {actuals && (
                <>
                  <TableHead>Actual MW</TableHead>
                  <TableHead>Error MW</TableHead>
                </>
              )}
              <TableHead>Published (GMT)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decision.points.map((p) => (
              <TableRow key={p.startTime}>
                <TableCell>{p.hour}</TableCell>
                <TableCell>{number(p.forecastMw)}</TableCell>
                {actuals && (
                  <>
                    <TableCell>{number(p.actualMw, 1)}</TableCell>
                    <TableCell>{number(p.errorMw, 1)}</TableCell>
                  </>
                )}
                <TableCell>
                  {p.publishTime
                    ? new Date(p.publishTime).toLocaleString("en-GB", {
                        timeZone: "Europe/London",
                      })
                    : "Missing"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </details>
    </>
  );
}
