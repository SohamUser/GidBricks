import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { number, shortDate, tooltipStyle } from "../lib/presentation";
import { ErrorMetrics } from "../components/Metric";
import type { Accuracy } from "../types";

export default function AccuracyView({
  accuracy,
  onInspect,
}: {
  accuracy: Accuracy;
  onInspect: (date: string) => void;
}) {
  const rankedDays = [...accuracy.days]
    .filter((d) => d.mae !== null)
    .sort((a, b) => b.mae! - a.mae!)
    .slice(0, 5);
  return (
    <>
      {accuracy.metrics.count < accuracy.expectedHours && (
        <Alert>
          <AlertTitle>
            {accuracy.metrics.count === 0 ? "No matched observations" : "Partial comparison coverage"}
          </AlertTitle>
          <AlertDescription>
            {accuracy.metrics.count} of {accuracy.expectedHours} hours have both a forecast and an actual.
            Missing pairs are excluded from the metrics. Select another date range to compare available data.
          </AlertDescription>
        </Alert>
      )}
      <ErrorMetrics metrics={accuracy.metrics} />
      <div className="coverage-summary">
        <Badge variant="secondary">
          {accuracy.metrics.count} / {accuracy.expectedHours} matched hours
        </Badge>
        <p>
          Missing pairs excluded. Forecast minus actual; positive bias means
          wind was overestimated.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Error by purchase decision day</h2>
          </CardTitle>
          <CardDescription>
            Mean absolute error (MW) against the following delivery day.
          </CardDescription>
          <CardAction>
            <Badge variant="outline">Lower is better</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div
            className="main-chart"
            role="img"
            aria-label="Daily mean absolute wind forecast errors. Values are in the daily scores table below."
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 800, height: 305 }}
            >
              <BarChart
                data={accuracy.days}
                margin={{ left: 0, right: 16, top: 10, bottom: 12 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="decisionDate"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.floor(accuracy.days.length / 8))}
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
                  labelFormatter={(value) =>
                    `Decision ${shortDate(String(value))}`
                  }
                  formatter={(value) => `${number(Number(value), 1)} MW`}
                />
                <Bar
                  dataKey="mae"
                  name="Mean absolute error"
                  fill="var(--forecast)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={40}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <div className="bottom-grid">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Bias by delivery hour</h2>
            </CardTitle>
            <CardDescription>
              Mean signed error (MW). Above zero means overestimation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="small-chart"
              role="img"
              aria-label="Average signed forecast error by delivery hour in GMT"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                initialDimension={{ width: 800, height: 305 }}
              >
                <AreaChart
                  data={accuracy.byHour}
                  margin={{ left: 0, right: 8, bottom: 12 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="hour"
                    interval={5}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => `${number(Number(value), 1)} MW`}
                  />
                  <ReferenceLine y={0} stroke="var(--muted-foreground)" />
                  <Area
                    dataKey="bias"
                    name="Bias"
                    stroke="var(--actual)"
                    fill="var(--actual)"
                    fillOpacity={0.08}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Largest daily misses</h2>
            </CardTitle>
            <CardDescription>
              Select a decision date to inspect its forecast and outcome.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rank-list">
              {rankedDays.map((day) => (
                <Button
                  variant="ghost"
                  key={day.decisionDate}
                  onClick={() => onInspect(day.decisionDate)}
                >
                  <span>
                    {shortDate(day.decisionDate)}
                    <small>Delivery {shortDate(day.deliveryDate)}</small>
                  </span>
                  <strong>
                    {number(day.mae)} <small>MW MAE</small>
                  </strong>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Alert className="analysis-note">
        <AlertTitle>
          Historical comparison, not a future reserve recommendation
        </AlertTitle>
        <AlertDescription>
          These results describe the selected January decisions. Differences in
          dataset coverage can contribute to the gap; the metrics are not
          calibrated confidence intervals.
        </AlertDescription>
      </Alert>
      <details className="interval-table">
        <summary>Daily scores and coverage</summary>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Decision</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>MAE MW</TableHead>
              <TableHead>RMSE MW</TableHead>
              <TableHead>Bias MW</TableHead>
              <TableHead>Matched hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accuracy.days.map((day) => (
              <TableRow key={day.decisionDate}>
                <TableCell>{shortDate(day.decisionDate)}</TableCell>
                <TableCell>{shortDate(day.deliveryDate)}</TableCell>
                <TableCell>{number(day.mae, 1)}</TableCell>
                <TableCell>{number(day.rmse, 1)}</TableCell>
                <TableCell>{number(day.bias, 1)}</TableCell>
                <TableCell>{day.count}/24</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </details>
    </>
  );
}
