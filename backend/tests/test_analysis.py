import math
import unittest
from unittest.mock import patch

from app.services.forecast_selection import Analysis, index_rows, timestamp
from app.services.accuracy import metrics
from app.config import decision_cutoff


def forecast(value, published="2026-01-01T09:50:00Z", start="2026-01-02T00:00:00Z"):
    return {"startTime": start, "publishTime": published, "generation": value}


def actual(
    value, start="2026-01-02T00:00:00Z", published="2026-01-03T00:00:00Z", fuel="WIND"
):
    return {
        "startTime": start,
        "publishTime": published,
        "generation": value,
        "fuelType": fuel,
    }


class AnalysisTests(unittest.TestCase):
    def setUp(self):
        environment = patch.dict("os.environ", {"DECISION_CUTOFF_LOCAL": "09:50"})
        environment.start()
        self.addCleanup(environment.stop)

    def test_before_exact_and_after_cutoff(self):
        before = forecast(80, "2026-01-01T09:49:59Z")
        exact = forecast(90, "2026-01-01T09:50:00Z")
        after = forecast(999, "2026-01-01T09:50:01Z")
        for rows, expected in [
            ([before], 80),
            ([before, exact], 90),
            ([before, exact, after], 90),
            ([after], None),
        ]:
            with self.subTest(rows=rows):
                point = Analysis({"WINDFOR": rows, "FUELHH": []}).days["2026-01-01"][
                    "points"
                ][0]
                self.assertEqual(point["forecastMw"], expected)
                if expected is not None:
                    self.assertLessEqual(
                        timestamp(point["publishTime"]),
                        timestamp("2026-01-01T09:50:00Z"),
                    )

    def test_configured_cutoff_changes_selection_without_lookahead(self):
        snapshot = {
            "WINDFOR": [
                forecast(80, "2026-01-01T07:59:59Z"),
                forecast(90, "2026-01-01T08:00:00Z"),
                forecast(100, "2026-01-01T08:00:01Z"),
            ],
            "FUELHH": [],
        }
        model = Analysis(snapshot, cutoff_local="08:00")
        self.assertEqual(model.days["2026-01-01"]["points"][0]["forecastMw"], 90)
        self.assertEqual(model.days["2026-01-31"]["cutoff"], "2026-01-31T08:00:00Z")
        self.assertEqual(model.days["2026-01-31"]["deliveryDate"], "2026-02-01")
        with patch.dict("os.environ", {"DECISION_CUTOFF_LOCAL": "08:00"}):
            self.assertEqual(Analysis(snapshot).cutoff_time.hour, 8)
        self.assertEqual(
            Analysis(snapshot).days["2026-01-01"]["points"][0]["forecastMw"], 100
        )
        for invalid in ["24:00", "9:50", "09:60", "09:50Z", "09:50:00", ""]:
            with self.subTest(value=invalid), self.assertRaises(ValueError):
                decision_cutoff(invalid)

    def test_hourly_mapping_requires_both_halves_and_preserves_publication(self):
        first, second = actual(80), actual(120, "2026-01-02T00:30:00Z")
        for actuals in [[first], [second], []]:
            point = Analysis({"WINDFOR": [forecast(100)], "FUELHH": actuals}).days[
                "2026-01-01"
            ]["points"][0]
            self.assertIsNone(point["actualMw"])
            self.assertIsNone(point["errorMw"])
        day = Analysis(
            {
                "WINDFOR": [forecast(100), forecast(100)],
                "FUELHH": [first, second, first, second],
            }
        ).days["2026-01-01"]
        self.assertEqual(len(day["points"]), 24)
        self.assertEqual(day["metrics"]["count"], 1)
        self.assertEqual(day["points"][0]["publishTime"], "2026-01-01T09:50:00Z")
        self.assertEqual(day["points"][0]["actualMw"], 100)
        self.assertEqual(day["metrics"]["mae"], 0)
        self.assertEqual(day["forecastEnergyMwh"], 100)
        # A hypothetical constant-MW split has 20 MW MAE, not zero: no silent mapping.
        self.assertEqual(sum(abs(100 - value) for value in [80, 120]) / 2, 20)

    def test_cutoff_and_hourly_alignment(self):
        snapshot = {
            "WINDFOR": [
                forecast(100, "2026-01-01T08:00:00Z"),
                forecast(120),
                forecast(999, "2026-01-01T09:50:01Z"),
                forecast(200, "2026-01-01T08:00:00Z", "2026-01-02T01:00:00Z"),
            ],
            "FUELHH": [actual(80), actual(100, "2026-01-02T00:30:00Z")],
        }
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
        rows = [
            actual(90),
            actual(90),
            actual(100, published="2026-01-04T00:00:00Z"),
            actual(999, fuel="CCGT"),
        ]
        self.assertEqual(next(iter(index_rows(rows).values()))[1], 100)
        with self.assertRaisesRegex(ValueError, "Conflicting"):
            index_rows([actual(90), actual(91)])
        with self.assertRaisesRegex(ValueError, "Conflicting"):
            index_rows([forecast(1), forecast(2)], forecast=True)

    def test_metric_formulas_and_missing_values(self):
        result = metrics([{"errorMw": 3}, {"errorMw": -4}, {"errorMw": None}])
        self.assertEqual(result["mae"], 3.5)
        self.assertEqual(result["bias"], -0.5)
        self.assertEqual(result["rmse"], math.sqrt(12.5))
        self.assertEqual(result["p90"], 4)
        self.assertIsNone(metrics([])["mae"])

    def test_month_boundary_and_weighted_metrics(self):
        model = Analysis(
            {
                "WINDFOR": [
                    forecast(10),
                    forecast(20, "2026-01-02T08:00:00Z", "2026-01-03T00:00:00Z"),
                    forecast(30, "2026-01-02T08:00:00Z", "2026-01-03T01:00:00Z"),
                ],
                "FUELHH": [
                    actual(0),
                    actual(0, "2026-01-02T00:30:00Z"),
                    actual(0, "2026-01-03T00:00:00Z"),
                    actual(0, "2026-01-03T00:30:00Z"),
                    actual(0, "2026-01-03T01:00:00Z"),
                    actual(0, "2026-01-03T01:30:00Z"),
                ],
            }
        )
        self.assertEqual(model.days["2026-01-31"]["deliveryDate"], "2026-02-01")
        self.assertEqual(
            model.accuracy("2026-01-01", "2026-01-02")["metrics"]["mae"], 20
        )

    def test_incompatible_cadence_rejected(self):
        with self.assertRaisesRegex(ValueError, "not hourly"):
            Analysis(
                {"WINDFOR": [forecast(10, start="2026-01-02T00:30:00Z")], "FUELHH": []}
            )

    def test_mape_zero_missing_and_nonfinite(self):
        result = metrics(
            [
                {"errorMw": 20, "actualMw": 100},
                {"errorMw": -10, "actualMw": 50},
                {"errorMw": 5, "actualMw": 0},
                {"errorMw": None, "actualMw": 10},
                {"errorMw": float("nan"), "actualMw": 10},
                {"errorMw": float("inf"), "actualMw": 10},
            ]
        )
        self.assertEqual(result["count"], 3)
        self.assertEqual(result["mae"], 35 / 3)
        self.assertEqual(result["bias"], 5)
        self.assertEqual(result["rmse"], math.sqrt(525 / 3))
        self.assertEqual(result["mape"], 20)
        self.assertEqual(result["mapeCount"], 2)
        self.assertEqual(result["mapeExcludedCount"], 4)
        zero = metrics([{"errorMw": 0, "actualMw": 0}])
        self.assertEqual(zero["mae"], 0)
        self.assertIsNone(zero["mape"])
        self.assertEqual(zero["mapeExcludedCount"], 1)
        self.assertIsNone(metrics([])["mape"])

    def test_duplicate_forecasts_and_revision_conflicts_are_order_independent(self):
        self.assertEqual(
            len(index_rows([forecast(100), forecast(100)], forecast=True)), 1
        )
        newer = actual(120, published="2026-01-05T00:00:00Z")
        for rows in [[newer, actual(90), actual(91)], [actual(90), newer, actual(91)]]:
            with self.assertRaisesRegex(ValueError, "Conflicting"):
                index_rows(rows)

    def test_nullable_latest_revision_does_not_fall_back(self):
        model = Analysis(
            {
                "WINDFOR": [forecast(100, "2026-01-01T08:00:00Z"), forecast(None)],
                "FUELHH": [
                    actual(80),
                    actual(None, published="2026-01-04T00:00:00Z"),
                    actual(120, "2026-01-02T00:30:00Z"),
                ],
            }
        )
        point = model.days["2026-01-01"]["points"][0]
        self.assertIsNone(point["forecastMw"])
        self.assertEqual(point["publishTime"], "2026-01-01T09:50:00Z")
        self.assertIsNone(point["actualMw"])
        self.assertIsNone(point["errorMw"])
        self.assertEqual(model.days["2026-01-01"]["metrics"]["mapeExcludedCount"], 24)

    def test_numeric_conversion_and_invalid_values(self):
        self.assertEqual(
            next(iter(index_rows([forecast("123.5")], forecast=True).values()))[1],
            123.5,
        )
        for value in [True, "bad", float("nan"), float("inf"), -1]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                index_rows([forecast(value)], forecast=True)

    def test_offset_timestamps_and_join_by_delivery_not_publication(self):
        self.assertEqual(
            timestamp("2026-01-01T10:50:00+01:00"), timestamp("2026-01-01T09:50:00Z")
        )
        with self.assertRaises(ValueError):
            timestamp("2026-01-01T09:50:00")
        model = Analysis(
            {
                "WINDFOR": [
                    forecast(
                        100, "2026-01-31T10:50:00+01:00", "2026-02-01T01:00:00+01:00"
                    ),
                    forecast(999, "2026-01-31T09:50:01Z", "2026-02-01T00:00:00Z"),
                ],
                "FUELHH": [
                    actual(80, "2026-02-01T00:00:00Z", "2026-02-02T00:00:00Z"),
                    actual(100, "2026-02-01T00:30:00Z", "2026-02-03T00:00:00Z"),
                ],
            }
        )
        day = model.days["2026-01-31"]
        self.assertEqual(day["cutoff"], "2026-01-31T09:50:00Z")
        self.assertEqual(day["points"][0]["errorMw"], 10)
        self.assertEqual(day["metrics"]["count"], 1)

    def test_hourly_averaging_is_explicit(self):
        day = Analysis(
            {
                "WINDFOR": [forecast(100)],
                "FUELHH": [actual(80), actual(120, "2026-01-02T00:30:00Z")],
            }
        ).days["2026-01-01"]
        self.assertEqual(day["metrics"]["mae"], 0)
        self.assertEqual(day["metrics"]["mape"], 0)


if __name__ == "__main__":
    unittest.main()
