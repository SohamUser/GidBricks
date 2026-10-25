import type { Metrics } from "./types";

export const number = (value: number | null | undefined, digits = 0) =>
  value == null
    ? "—"
    : value.toLocaleString("en-GB", { maximumFractionDigits: digits });
export const shortDate = (value: string) =>
  new Date(value + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
  });
export const tooltipStyle = {
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--foreground)",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 20px #142f4310",
};

export function Metric({
  label,
  value,
  unit,
  detail,
}: {
  label: string;
  value: number | null;
  unit: string;
  detail: string;
}) {
  return (
    <article className="metric">
      <span className="eyebrow">{label}</span>
      <div className="metric-value">
        {number(value, 1)} <span>{unit}</span>
      </div>
      <p>{detail}</p>
    </article>
  );
}

export function ErrorMetrics({ metrics }: { metrics: Metrics }) {
  return (
    <div className="metrics">
      <Metric
        label="Mean absolute error"
        value={metrics.mae}
        unit="MW"
        detail="Average size of forecast error"
      />
      <Metric
        label="Root mean squared error"
        value={metrics.rmse}
        unit="MW"
        detail="More weight on larger misses"
      />
      <Metric
        label="Forecast bias"
        value={metrics.bias}
        unit="MW"
        detail="Positive = wind overestimated"
      />
      <Metric
        label="90th percentile error"
        value={metrics.p90}
        unit="MW"
        detail="90% of absolute errors at or below"
      />
    </div>
  );
}
