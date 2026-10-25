import type { Accuracy, Coverage, Decision } from "../types";

async function get<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      typeof body?.detail === "string"
        ? body.detail
        : `Request failed (${response.status}). Check the selected dates and try again.`,
    );
  }
  return response.json();
}

export function loadDashboard(
  date: string,
  range: { from: string; to: string },
  signal: AbortSignal,
): Promise<[Decision, Accuracy, Coverage]> {
  return Promise.all([
    get<Decision>(`/api/decision?date=${date}`, signal),
    get<Accuracy>(`/api/accuracy?from=${range.from}&to=${range.to}`, signal),
    get<Coverage>("/api/coverage", signal),
  ]);
}
