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
