import unittest
from fastapi.testclient import TestClient
from backend.main import app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_boundaries_and_validation(self):
        self.assertEqual(self.client.get("/api/decision?date=2026-01-31").json()["deliveryDate"], "2026-02-01")
        for query in ["date=2025-12-31", "date=2026-02-01", "date=invalid"]:
            self.assertEqual(self.client.get("/api/decision?" + query).status_code, 422)
        self.assertEqual(self.client.get("/api/accuracy?from=2026-01-15&to=2026-01-01").status_code, 422)

    def test_real_snapshot_integrity(self):
        coverage = self.client.get("/api/coverage").json()
        self.assertEqual(coverage["matchedHours"], 744)
        self.assertEqual(coverage["expectedHours"], 744)
        for day in coverage["days"]:
            result = self.client.get("/api/decision?date=" + day["decisionDate"]).json()
            self.assertEqual(result["forecastHours"], 24)
            self.assertTrue(all(p["publishTime"] <= result["cutoff"] for p in result["points"]))

    def test_export(self):
        result = self.client.get("/api/export?from=2026-01-31&to=2026-01-31")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(len(result.text.strip().splitlines()), 25)
        self.assertIn("2026-02-01", result.text)
