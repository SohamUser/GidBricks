import csv
import io
import json
from datetime import date
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from backend.analysis import Analysis, FIRST, LAST

ROOT = Path(__file__).resolve().parents[1]
app = FastAPI(title="Wind Desk", version="1.0.0")


@lru_cache(maxsize=1)
def analysis():
    try:
        return Analysis(json.loads((ROOT / "data/snapshot.json").read_text(encoding="utf-8")))
    except FileNotFoundError:
        raise HTTPException(503, "Historical snapshot unavailable. Run python -m scripts.fetch_data.")


def validate_range(first, last):
    if not FIRST <= first <= last <= LAST:
        raise HTTPException(422, "Decision dates must be ordered and within January 2026.")


@app.get("/api/health")
def health():
    return {"status": "ok", "snapshotReady": (ROOT / "data/snapshot.json").exists()}


@app.get("/api/decision")
def decision(date: date = Query(...)):
    validate_range(date, date)
    return analysis().days[str(date)]


@app.get("/api/accuracy")
def accuracy(first: date = Query(FIRST, alias="from"), last: date = Query(LAST, alias="to")):
    validate_range(first, last)
    return analysis().accuracy(str(first), str(last))


@app.get("/api/coverage")
def coverage():
    result = analysis().accuracy(str(FIRST), str(LAST))
    manifest = json.loads((ROOT / "data/manifest.json").read_text(encoding="utf-8"))
    return {"retrievedAt": manifest["retrievedAt"], "expectedHours": result["expectedHours"],
            "matchedHours": result["metrics"]["count"], "days": result["days"]}


@app.get("/api/export")
def export(first: date = Query(FIRST, alias="from"), last: date = Query(LAST, alias="to")):
    validate_range(first, last)
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(["decision_date", "delivery_start_utc", "cutoff_utc", "forecast_mw", "actual_hourly_mean_mw", "forecast_minus_actual_mw", "forecast_publication_utc"])
    for key, day in analysis().days.items():
        if str(first) <= key <= str(last):
            for p in day["points"]:
                writer.writerow([key, p["startTime"], day["cutoff"], p["forecastMw"], p["actualMw"], p["errorMw"], p["publishTime"]])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="wind-desk.csv"'})


if (ROOT / "dist").exists():
    app.mount("/", StaticFiles(directory=ROOT / "dist", html=True), name="frontend")
