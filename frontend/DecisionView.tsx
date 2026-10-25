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
import { ArrowRight, Check, Clock3, Info } from "lucide-react";
import {
  number,
  shortDate,
  tooltipStyle,
  Metric,
  ErrorMetrics,
} from "./shared";
import type { Decision } from "./types";

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
    ...new Set(decision.points.map((p) => p.publishTime).filter(Boolean)),
  ];
  const maxAge = Math.max(...decision.points.map((p) => p.ageHours ?? 0));
  return (
    decision && (
      <>
        <div className="metrics">
          <Metric
            label="Forecast wind energy"
            value={
              decision.forecastEnergyMwh == null
                ? null
                : decision.forecastEnergyMwh / 1000
            }
            unit="GWh"
            detail={
              decision.forecastHours === 24
                ? "Across the full delivery day"
                : `Partial total · ${decision.forecastHours}/24 hours`
            }
          />
          <Metric
            label="Peak wind generation"
            value={decision.peakMw}
            unit="MW"
            detail="Highest hourly forecast"
          />
          <Metric
            label="Minimum wind generation"
            value={decision.minMw}
            unit="MW"
            detail="Lowest hourly forecast"
          />
          <article className="metric">
            <span className="eyebrow">Forecast coverage</span>
            <div className="metric-value">
              {decision.forecastHours}
              <span> / 24 hours</span>
            </div>
            <p className={decision.forecastHours === 24 ? "green-text" : ""}>
              <Check size={13} />
              {decision.forecastHours === 24
                ? "Complete delivery-day outlook"
                : "Incomplete forecast outlook"}
            </p>
          </article>
        </div>
        <section className="panel forecast-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Wind generation outlook <span className="unit-pill">MW</span>
              </h2>
              <p>
                Delivery {shortDate(decision.deliveryDate)} 2026 · hourly
                intervals · UK time
              </p>
            </div>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={actuals}
                onChange={(e) => setActuals(e.target.checked)}
              />
              <span className="toggle" />
              Show actuals <span className="retrospective">RETROSPECTIVE</span>
            </label>
          </div>
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
            <span className="chart-caption">
              Latest eligible publication for each hour
            </span>
          </div>
          <div
            className="main-chart"
            role="img"
            aria-label="Hourly wind generation forecast; detailed values in the table below"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={decision.points}
                margin={{ top: 12, right: 20, left: 12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#279a80" stopOpacity={0.2} />
                    <stop
                      offset="100%"
                      stopColor="#279a80"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#e8eeea"
                  vertical={false}
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: "#7a8781" }}
                  interval={3}
                  axisLine={false}
                  tickLine={false}
                  dy={9}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#7a8781" }}
                  tickFormatter={(v) => number(v)}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => `${number(Number(v))} MW`}
                />
                <Area
                  type="linear"
                  dataKey="forecastMw"
                  name="Forecast"
                  stroke="#16866a"
                  strokeWidth={2.5}
                  fill="url(#windFill)"
                  isAnimationActive={false}
                />
                {actuals && (
                  <Line
                    type="linear"
                    dataKey="actualMw"
                    name="Actual"
                    stroke="#bd8550"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 4"
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer">
            <Info size={14} />
            <span>
              Only forecasts published by {shortDate(date)}, 09:50 GMT are
              included.
            </span>
            <span className="source-label">
              SOURCE: ELEXON · WINDFOR{actuals ? " + FUELHH" : ""}
            </span>
          </div>
        </section>
        <div className="bottom-grid">
          <section className="panel provenance">
            <div className="panel-heading">
              <div>
                <h2>
                  <Clock3 size={17} />
                  Available at decision time
                </h2>
                <p>A traceable outlook, without hindsight.</p>
              </div>
              <span className="status-pill">
                {publications.length} publication
                {publications.length !== 1 ? "s" : ""}
              </span>
            </div>
            <dl>
              <div>
                <dt>Publication time{publications.length > 1 ? "s" : ""}</dt>
                <dd>
                  {publications.map((p) => (
                    <span key={p}>
                      {new Date(p!).toLocaleString("en-GB", {
                        timeZone: "Europe/London",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      GMT
                      <br />
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Oldest forecast at cutoff</dt>
                <dd>{number(maxAge, 2)} hours</dd>
              </div>
              <div>
                <dt>Selection rule</dt>
                <dd>Latest publication ≤ 09:50</dd>
              </div>
            </dl>
          </section>
          <section className="insight-card">
            <span className="section-kicker">PUT THE OUTLOOK IN CONTEXT</span>
            <h2>How much did the forecast miss?</h2>
            <p>
              Review January’s measured forecast errors to understand the
              uncertainty around a day-ahead wind outlook.
            </p>
            <button onClick={() => onAccuracy()}>
              Explore forecast accuracy <ArrowRight size={16} />
            </button>
            <span className="insight-footnote">
              Historical evidence · no future guarantee
            </span>
          </section>
        </div>
        {actuals && (
          <section className="retrospective-section">
            <div className="section-title">
              <h2>Delivery-day outcome</h2>
              <span>
                {decision.metrics.count}/24 matched hours · retrospective
              </span>
            </div>
            <ErrorMetrics metrics={decision.metrics} />
          </section>
        )}
        <details className="panel interval-table">
          <summary>Inspect hourly values & publication timestamps</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Delivery (GMT)</th>
                  <th>Forecast MW</th>
                  {actuals && (
                    <>
                      <th>Actual MW</th>
                      <th>Error MW</th>
                    </>
                  )}
                  <th>Published (GMT)</th>
                </tr>
              </thead>
              <tbody>
                {decision.points.map((p) => (
                  <tr key={p.startTime}>
                    <td>{p.hour}</td>
                    <td>{number(p.forecastMw)}</td>
                    {actuals && (
                      <>
                        <td>{number(p.actualMw, 1)}</td>
                        <td>{number(p.errorMw, 1)}</td>
                      </>
                    )}
                    <td>
                      {p.publishTime
                        ? new Date(p.publishTime).toLocaleString("en-GB", {
                            timeZone: "Europe/London",
                          })
                        : "Missing"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </>
    )
  );
}
