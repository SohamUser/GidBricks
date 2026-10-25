import json
import unittest
from datetime import date, timedelta
from http.client import IncompleteRead
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from app.services import elexon_client as client
from app.services.forecast_selection import iso, timestamp


def actual_day():
    midnight = timestamp("2026-01-02T00:00:00Z")
    return [
        {
            "startTime": iso(midnight + timedelta(minutes=30 * i)),
            "publishTime": "2026-01-03T00:00:00Z",
            "fuelType": "WIND",
            "generation": 100,
        }
        for i in range(48)
    ]


class ElexonClientTests(unittest.TestCase):
    def test_flat_json_and_incomplete_actuals(self):
        rows = actual_day()
        self.assertEqual(
            len(client.parse_response(json.dumps(rows), "FUELHH", date(2026, 1, 2))), 48
        )
        for invalid in [
            rows[:-1],
            [],
            {"data": rows},
            rows + [dict(rows[0], fuelType="CCGT")],
            [dict(r, generation=None) if i == 0 else r for i, r in enumerate(rows)],
        ]:
            with self.subTest(kind=type(invalid)), self.assertRaises(ValueError):
                client.parse_response(json.dumps(invalid), "FUELHH", date(2026, 1, 2))
        with self.assertRaises(ValueError):
            client.parse_response(b"[{", "FUELHH", date(2026, 1, 2))

    def test_forecast_publication_window(self):
        row = {
            "startTime": "2026-01-02T00:00:00Z",
            "publishTime": "2026-01-01T09:30:00Z",
            "generation": 100,
        }
        self.assertEqual(
            client.parse_response(json.dumps([row]), "WINDFOR", date(2026, 1, 1)), [row]
        )
        with self.assertRaisesRegex(ValueError, "outside requested window"):
            client.parse_response(json.dumps([row]), "WINDFOR", date(2026, 1, 3))

    def test_retryable_failures_and_timeout(self):
        failures = [
            HTTPError("url", 429, "limited", {}, None),
            HTTPError("url", 503, "unavailable", {}, None),
            URLError("offline"),
            TimeoutError(),
            IncompleteRead(b"["),
        ]
        for failure in failures:
            with (
                self.subTest(failure=type(failure)),
                patch.object(
                    client, "urlopen", side_effect=[failure, BytesIO(b"[]")]
                ) as request,
                patch.object(client.time, "sleep") as sleep,
            ):
                self.assertEqual(client.fetch("url"), b"[]")
                request.assert_called_with("url", timeout=60)
                sleep.assert_called_once_with(1)

    def test_retry_limit_and_nonretryable_http_error(self):
        with (
            patch.object(client, "urlopen", side_effect=TimeoutError()) as request,
            patch.object(client.time, "sleep") as sleep,
        ):
            with self.assertRaises(TimeoutError):
                client.fetch("url")
            self.assertEqual(request.call_count, 4)
            self.assertEqual([c.args[0] for c in sleep.call_args_list], [1, 2, 4])
        with patch.object(
            client, "urlopen", side_effect=HTTPError("url", 400, "bad", {}, None)
        ) as request:
            with self.assertRaises(HTTPError):
                client.fetch("url")
            self.assertEqual(request.call_count, 1)

    def test_network_failure_does_not_overwrite_existing_data(self):
        row = {
            "startTime": "2025-12-26T00:00:00Z",
            "publishTime": "2025-12-25T09:30:00Z",
            "generation": 100,
        }
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "snapshot.json").write_text("original")
            with (
                patch.object(client, "DATA_DIR", root),
                patch.object(
                    client,
                    "fetch",
                    side_effect=[json.dumps([row]).encode(), TimeoutError()],
                ),
                patch.object(client, "atomic_write") as write,
            ):
                with self.assertRaises(TimeoutError):
                    client.main()
                write.assert_not_called()
            self.assertEqual((root / "snapshot.json").read_text(), "original")
            self.assertFalse((root / "raw").exists())

    def test_complete_snapshot_coverage_required(self):
        with self.assertRaisesRegex(ValueError, "Incomplete decision coverage"):
            client.validate_snapshot({"WINDFOR": [], "FUELHH": []})
        snapshot = json.loads((client.DATA_DIR / "snapshot.json").read_text())
        snapshot["WINDFOR"] = [
            row
            for row in snapshot["WINDFOR"]
            if row["startTime"] != "2026-01-02T00:00:00Z"
        ]
        with self.assertRaisesRegex(
            ValueError, "Incomplete decision coverage for 2026-01-01"
        ):
            client.validate_snapshot(snapshot)

    def test_atomic_file_write(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "raw" / "sample.json"
            client.atomic_write(path, b"original")
            client.atomic_write(path, b"replacement")
            self.assertEqual(path.read_bytes(), b"replacement")
            self.assertEqual(len(list(path.parent.iterdir())), 1)
