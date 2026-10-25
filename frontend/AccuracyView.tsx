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
import { ArrowRight, Check, Info } from "lucide-react";
import { number, shortDate, tooltipStyle, ErrorMetrics } from "./shared";
import type { Accuracy } from "./types";

export default function AccuracyView({
  accuracy,
  onInspect,
}: {
  accuracy: Accuracy;
  onInspect: (date: string) => void;
}) {
  return (
    accuracy && (
      <>
        <ErrorMetrics metrics={accuracy.metrics} />
        <div className="coverage-banner">
          <Check size={16} />
          <strong>
            {accuracy.metrics.count} / {accuracy.expectedHours} matched hours
          </strong>
          <span>
            Missing pairs excluded · error = forecast − actual · hourly aligned
          </span>
        </div>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Daily forecast error</h2>
              <p>Mean absolute error by purchase decision date · MW</p>
            </div>
            <span className="unit-pill">LOWER IS BETTER</span>
          </div>
          <div
            className="main-chart"
            role="img"
            aria-label="Daily mean absolute wind forecast error"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={accuracy.days}
                margin={{ left: 15, right: 15, top: 10 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#e8eeea"
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="decisionDate"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.floor(accuracy.days.length / 8))}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) => shortDate(String(v))}
                  formatter={(v) => `${number(Number(v))} MW`}
                />
                <Bar
                  dataKey="mae"
                  name="MAE"
                  fill="#278c72"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <div className="bottom-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Bias through the delivery day</h2>
                <p>Mean forecast − actual, by delivery hour · MW</p>
              </div>
            </div>
            <div className="small-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={accuracy.byHour}
                  margin={{ left: 5, right: 20 }}
                >
                  <CartesianGrid vertical={false} stroke="#e8eeea" />
                  <XAxis
                    dataKey="hour"
                    interval={5}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => `${number(Number(v))} MW`}
                  />
                  <ReferenceLine y={0} stroke="#7d8e85" />
                  <Area
                    dataKey="bias"
                    name="Bias"
                    stroke="#bd8550"
                    fill="#bd855025"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Largest daily misses</h2>
                <p>Decision dates ranked by mean absolute error</p>
              </div>
            </div>
            <div className="rank-list">
              {[...accuracy.days]
                .filter((d) => d.mae != null)
                .sort((a, b) => b.mae! - a.mae!)
                .slice(0, 5)
                .map((day, i) => (
                  <button
                    key={day.decisionDate}
                    onClick={() => {
                      onInspect(day.decisionDate);
                    }}
                  >
                    <span className="rank">0{i + 1}</span>
                    <span>
                      {shortDate(day.decisionDate)}
                      <small>Delivery {shortDate(day.deliveryDate)}</small>
                    </span>
                    <strong>
                      {number(day.mae)} <small>MW</small>
                    </strong>
                    <ArrowRight size={15} />
                  </button>
                ))}
            </div>
          </section>
        </div>
        <p className="analysis-note">
          <Info size={15} />
          These are descriptive results for the selected January decisions. They
          are not a calibrated confidence interval or a recommended procurement
          reserve.
        </p>
      </>
    )
  );
}
