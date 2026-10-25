"""Offline checks of the committed Elexon fixture and its provenance."""

import hashlib
import json
import unittest
from collections import defaultdict
from datetime import date, timedelta

from app.config import DATA_DIR
from app.services.elexon_client import parse_response, validate_snapshot
from app.services.forecast_selection import Analysis, timestamp


class SnapshotTests(unittest.TestCase):
    def test_all_retained_responses_and_checksums(self):
        manifest = json.loads((DATA_DIR / "manifest.json").read_text())
        for request in manifest["requests"]:
            with self.subTest(file=request["file"]):
                path = DATA_DIR / request["file"]
                payload = path.read_bytes()
                self.assertEqual(hashlib.sha256(payload).hexdigest(), request["sha256"])
                dataset, day = path.stem.split("-", 1)
                rows = parse_response(payload, dataset, date.fromisoformat(day))
                self.assertEqual(len(rows), request["rows"])

    def test_all_selected_forecasts_are_latest_eligible(self):
        snapshot = json.loads((DATA_DIR / "snapshot.json").read_text())
        validate_snapshot(snapshot)
        by_start = defaultdict(list)
        for row in snapshot["WINDFOR"]:
            by_start[timestamp(row["startTime"])].append(row)
        actuals = {}
        for row in snapshot["FUELHH"]:
            start = timestamp(row["startTime"])
            if row["fuelType"] == "WIND" and (
                start not in actuals
                or timestamp(row["publishTime"])
                > timestamp(actuals[start]["publishTime"])
            ):
                actuals[start] = row
        for day in Analysis(snapshot).days.values():
            cutoff = timestamp(day["cutoff"])
            for point in day["points"]:
                start = timestamp(point["startTime"])
                eligible = [
                    r for r in by_start[start] if timestamp(r["publishTime"]) <= cutoff
                ]
                latest = max(eligible, key=lambda r: timestamp(r["publishTime"]))
                self.assertEqual(
                    timestamp(point["publishTime"]), timestamp(latest["publishTime"])
                )
                self.assertEqual(point["forecastMw"], latest["generation"])
                expected_actual = (
                    actuals[start]["generation"]
                    + actuals[start + timedelta(minutes=30)]["generation"]
                ) / 2
                self.assertEqual(point["actualMw"], expected_actual)
