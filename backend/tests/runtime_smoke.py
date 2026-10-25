"""Read-only HTTP checks: python -m backend.tests.runtime_smoke --base-url URL."""

import argparse
import csv
import io
import math

import httpx

from backend.app.schemas.responses import (
    AccuracyResponse,
    CoverageResponse,
    DecisionResponse,
    HealthResponse,
)


def verify(base_url):
    with httpx.Client(base_url=base_url.rstrip("/"), timeout=10) as client:

        def get(path, schema=None, status=200):
            response = client.get(path)
            assert response.status_code == status, (
                path,
                response.status_code,
                response.text[:200],
            )
            if schema:
                schema.model_validate(response.json())
            print(f"{response.status_code} {path}")
            return response

        assert get("/api/health", HealthResponse).json()["snapshotReady"]
        for decision, delivery in [
            ("2026-01-01", "2026-01-02"),
            ("2026-01-31", "2026-02-01"),
        ]:
            day = get("/api/decision?date=" + decision, DecisionResponse).json()
            assert day["deliveryDate"] == delivery
            assert len(day["points"]) == 24
            assert all(p["publishTime"] <= day["cutoff"] for p in day["points"])
            assert all(p["startTime"].startswith(delivery) for p in day["points"])
        accuracy = get("/api/accuracy", AccuracyResponse).json()
        assert accuracy["metrics"]["count"] == accuracy["expectedHours"] == 744
        day = get("/api/decision?date=2026-01-15", DecisionResponse).json()
        errors = [p["forecastMw"] - p["actualMw"] for p in day["points"]]
        assert math.isclose(day["metrics"]["mae"], sum(map(abs, errors)) / 24)
        assert math.isclose(
            day["forecastEnergyMwh"], sum(p["forecastMw"] for p in day["points"])
        )
        assert get("/api/coverage", CoverageResponse).json()["matchedHours"] == 744
        export = get("/api/export?from=2026-01-31&to=2026-01-31")
        assert "text/csv" in export.headers["content-type"]
        assert len(list(csv.DictReader(io.StringIO(export.text)))) == 24
        get("/api/docs")
        assert "/api/decision" in get("/api/openapi.json").json()["paths"]
        for path in [
            "/api/decision?date=2026-02-01",
            "/api/decision?date=invalid",
            "/api/accuracy?from=2026-01-31&to=2026-01-01",
            "/api/export?from=2025-12-31&to=2026-01-01",
        ]:
            get(path, status=422)
        assert client.post("/api/decision?date=2026-01-15").status_code == 405
        get("/api/not-a-route", status=404)
        response = client.get(
            "/api/health", headers={"Origin": "https://example.invalid"}
        )
        assert "access-control-allow-origin" not in response.headers
        print(
            "PASS: same-origin API; unrelated browser origins receive no CORS permission"
        )
    print("PASS: all runtime endpoint, schema, boundary and calculation checks")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    verify(parser.parse_args().base_url)
