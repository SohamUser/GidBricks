import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.api import routes


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_boundaries_and_validation(self):
        self.assertEqual(
            self.client.get("/api/decision?date=2026-01-31").json()["deliveryDate"],
            "2026-02-01",
        )
        for query in ["date=2025-12-31", "date=2026-02-01", "date=invalid"]:
            self.assertEqual(self.client.get("/api/decision?" + query).status_code, 422)
        self.assertEqual(
            self.client.get("/api/accuracy?from=2026-01-15&to=2026-01-01").status_code,
            422,
        )

    def test_real_snapshot_integrity(self):
        coverage = self.client.get("/api/coverage").json()
        self.assertEqual(coverage["matchedHours"], 744)
        self.assertEqual(coverage["expectedHours"], 744)
        for day in coverage["days"]:
            result = self.client.get("/api/decision?date=" + day["decisionDate"]).json()
            self.assertEqual(result["forecastHours"], 24)
            self.assertTrue(
                all(p["publishTime"] <= result["cutoff"] for p in result["points"])
            )

    def test_export(self):
        result = self.client.get("/api/export?from=2026-01-31&to=2026-01-31")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(len(result.text.strip().splitlines()), 25)
        self.assertIn("2026-02-01", result.text)

    def test_mape_contract(self):
        result = self.client.get("/api/accuracy").json()["metrics"]
        self.assertIsInstance(result["mape"], float)
        self.assertEqual(result["mapeCount"], 744)
        self.assertEqual(result["mapeExcludedCount"], 0)

    def test_configured_cutoff_is_exposed_to_frontend(self):
        routes.analysis.cache_clear()
        try:
            with patch.dict("os.environ", {"DECISION_CUTOFF_LOCAL": "08:00"}):
                coverage = self.client.get("/api/coverage").json()
                self.assertEqual(coverage["decisionCutoffLocal"], "08:00")
                day = self.client.get("/api/decision?date=2026-01-31").json()
                self.assertEqual(day["cutoff"], "2026-01-31T08:00:00Z")
                self.assertTrue(
                    all(
                        p["publishTime"] <= day["cutoff"]
                        for p in day["points"]
                        if p["publishTime"]
                    )
                )
        finally:
            routes.analysis.cache_clear()

    def test_invalid_snapshot_is_unavailable_including_readiness(self):
        with (
            TemporaryDirectory() as directory,
            patch.object(routes, "DATA_DIR", Path(directory)),
        ):
            for payload in [
                None,
                "{",
                '{"WINDFOR": [{"generation": 1}], "FUELHH": []}',
            ]:
                routes.analysis.cache_clear()
                if payload is not None:
                    (Path(directory) / "snapshot.json").write_text(payload)
                for endpoint in ["/api/health", "/api/decision?date=2026-01-15"]:
                    self.assertEqual(self.client.get(endpoint).status_code, 503)
        routes.analysis.cache_clear()

    def test_api_documentation(self):
        schema = self.client.get("/api/openapi.json")
        self.assertEqual(schema.status_code, 200)
        self.assertIn("/api/decision", schema.json()["paths"])
        self.assertIn("/api/accuracy", schema.json()["paths"])
        self.assertIn("DecisionResponse", schema.json()["components"]["schemas"])
        self.assertEqual(
            schema.json()["paths"]["/api/decision"]["get"]["responses"]["200"][
                "content"
            ]["application/json"]["schema"]["$ref"],
            "#/components/schemas/DecisionResponse",
        )
        self.assertEqual(self.client.get("/api/docs").status_code, 200)
