export type Metrics = {
  count: number;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  p90: number | null;
  mape: number | null;
  mapeCount: number;
  mapeExcludedCount: number;
};
export type Point = {
  startTime: string;
  hour: string;
  forecastMw: number | null;
  actualMw: number | null;
  errorMw: number | null;
  publishTime: string | null;
  ageHours: number | null;
};
export type Decision = {
  decisionDate: string;
  deliveryDate: string;
  cutoff: string;
  points: Point[];
  metrics: Metrics;
  forecastHours: number;
  forecastEnergyMwh: number | null;
  peakMw: number | null;
  minMw: number | null;
};
export type Accuracy = {
  metrics: Metrics;
  expectedHours: number;
  days: (Metrics & { decisionDate: string; deliveryDate: string })[];
  byHour: (Metrics & { hour: string })[];
};
export type Coverage = {
  decisionCutoffLocal: string;
  retrievedAt: string;
  expectedHours: number;
  matchedHours: number;
};
