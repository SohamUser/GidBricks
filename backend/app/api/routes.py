import csv
import io
import json
from datetime import date
from functools import lru_cache

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from ..config import DATA_DIR, FIRST, LAST
from ..services.forecast_selection import Analysis
from ..schemas.responses import (
    AccuracyResponse,
    CoverageResponse,
    DecisionResponse,
    HealthResponse,
)

router = APIRouter(prefix="/api")


@lru_cache(maxsize=1)
def analysis():
    try:
        return Analysis(
            json.loads((DATA_DIR / "snapshot.json").read_text(encoding="utf-8"))
        )
    except (OSError, ValueError, KeyError, TypeError):
        raise HTTPException(
            503,
            "Historical snapshot unavailable or invalid. Run python -m backend.app.services.elexon_client.",
        )


def validate_range(first, last):
    if not FIRST <= first <= last <= LAST:
        raise HTTPException(
            422, "Decision dates must be ordered and within January 2026."
        )


@router.get("/health", response_model=HealthResponse)
def health():
    analysis()
    return {"status": "ok", "snapshotReady": (DATA_DIR / "snapshot.json").exists()}


@router.get("/decision", response_model=DecisionResponse)
def decision(date: date = Query(...)):
    validate_range(date, date)
    return analysis().days[str(date)]


@router.get("/accuracy", response_model=AccuracyResponse)
def accuracy(
    first: date = Query(FIRST, alias="from"), last: date = Query(LAST, alias="to")
):
    validate_range(first, last)
    return analysis().accuracy(str(first), str(last))


@router.get("/coverage", response_model=CoverageResponse)
def coverage():
    result = analysis().accuracy(str(FIRST), str(LAST))
    manifest = json.loads((DATA_DIR / "manifest.json").read_text(encoding="utf-8"))
    return {
        "decisionCutoffLocal": analysis().cutoff_time.strftime("%H:%M"),
        "retrievedAt": manifest["retrievedAt"],
        "expectedHours": result["expectedHours"],
        "matchedHours": result["metrics"]["count"],
        "days": result["days"],
    }


@router.get("/export")
def export(
    first: date = Query(FIRST, alias="from"), last: date = Query(LAST, alias="to")
):
    validate_range(first, last)
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(
        [
            "decision_date",
            "delivery_start_utc",
            "cutoff_utc",
            "forecast_mw",
            "actual_hourly_mean_mw",
            "forecast_minus_actual_mw",
            "forecast_publication_utc",
        ]
    )
    for key, day in analysis().days.items():
        if str(first) <= key <= str(last):
            for p in day["points"]:
                writer.writerow(
                    [
                        key,
                        p["startTime"],
                        day["cutoff"],
                        p["forecastMw"],
                        p["actualMw"],
                        p["errorMw"],
                        p["publishTime"],
                    ]
                )
    return Response(
        output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="wind-desk.csv"'},
    )
