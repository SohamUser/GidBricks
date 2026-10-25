import math
import unittest
from datetime import date

from backend.analysis import Analysis, index_rows, metrics


def forecast(value, published="2026-01-01T09:50:00Z", start="2026-01-02T00:00:00Z"):
    return {"startTime": start, "publishTime": published, "generation": value}


def actual(value, start="2026-01-02T00:00:00Z", published="2026-01-03T00:00:00Z", fuel="WIND"):
    return {"startTime": start, "publishTime": published, "generation": value, "fuelType": fuel}


class AnalysisTests(unittest.TestCase):
    def test_cutoff_and_hourly_alignment(self):
        snapshot = {"WINDFOR": [forecast(100, "2026-01-01T08:00:00Z"), forecast(120),
                    forecast(999, "2026-01-01T09:50:01Z"),
                    forecast(200, "2026-01-01T08:00:00Z", "2026-01-02T01:00:00Z")],
                    "FUELHH": [actual(80), actual(100, "2026-01-02T00:30:00Z")]}
        day = Analysis(snapshot).days["2026-01-01"]
        self.assertEqual(day["points"][0]["forecastMw"], 120)
        self.assertEqual(day["points"][0]["actualMw"], 90)
        self.assertEqual(day["points"][0]["errorMw"], 30)
        self.assertEqual(day["points"][1]["forecastMw"], 200)
        self.assertIsNone(day["points"][1]["actualMw"])
        self.assertIsNone(day["points"][2]["forecastMw"])
        self.assertEqual(day["metrics"]["count"], 1)
        self.assertEqual(day["forecastEnergyMwh"], 320)

    def test_actual_revisions_and_fuel_filter(self):
        rows = [actual(90), actual(90), actual(100, published="2026-01-04T00:00:00Z"), actual(999, fuel="CCGT")]
        self.assertEqual(next(iter(index_rows(rows).values()))[1], 100)
        with self.assertRaisesRegex(ValueError, "Conflicting"):
            index_rows([actual(90), actual(91)])
        with self.assertRaisesRegex(ValueError, "Conflicting"):
            index_rows([forecast(1), forecast(2)], forecast=True)

    def test_metric_formulas_and_missing_values(self):
        result = metrics([{"errorMw": 3}, {"errorMw": -4}, {"errorMw": None}])
        self.assertEqual(result["mae"], 3.5)
        self.assertEqual(result["bias"], -.5)
        self.assertEqual(result["rmse"], math.sqrt(12.5))
        self.assertEqual(result["p90"], 4)
        self.assertIsNone(metrics([])["mae"])

    def test_month_boundary_and_weighted_metrics(self):
        model = Analysis({"WINDFOR": [forecast(10), forecast(20, "2026-01-02T08:00:00Z", "2026-01-03T00:00:00Z"),
                           forecast(30, "2026-01-02T08:00:00Z", "2026-01-03T01:00:00Z")],
                          "FUELHH": [actual(0), actual(0, "2026-01-02T00:30:00Z"),
                           actual(0, "2026-01-03T00:00:00Z"), actual(0, "2026-01-03T00:30:00Z"),
                           actual(0, "2026-01-03T01:00:00Z"), actual(0, "2026-01-03T01:30:00Z")]})
        self.assertEqual(model.days["2026-01-31"]["deliveryDate"], "2026-02-01")
        self.assertEqual(model.accuracy("2026-01-01", "2026-01-02")["metrics"]["mae"], 20)

    def test_incompatible_cadence_rejected(self):
        with self.assertRaisesRegex(ValueError, "not hourly"):
            Analysis({"WINDFOR": [forecast(10, start="2026-01-02T00:30:00Z")], "FUELHH": []})


if __name__ == "__main__":
    unittest.main()
