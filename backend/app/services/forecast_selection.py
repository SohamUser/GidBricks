"""Pure selection and scoring logic; all values are average MW."""

import math
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from ..config import FIRST
from .accuracy import metrics, summarize_accuracy


def timestamp(value):
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("Source timestamp must include a timezone")
    return parsed.astimezone(timezone.utc)


def iso(value):
    return value.isoformat().replace("+00:00", "Z")


def index_rows(rows, forecast=False):
    """Resolve source updates by publication time; reject ambiguous same-publication values."""
    indexed = {}
    for row in rows:
        if not forecast and row.get("fuelType") != "WIND":
            continue
        start, published = timestamp(row["startTime"]), timestamp(row["publishTime"])
        generation = row["generation"]
        if (
            not isinstance(generation, (int, float))
            or not math.isfinite(generation)
            or generation < 0
        ):
            raise ValueError("Invalid generation")
        key = (start, published) if forecast else start
        previous = indexed.get(key)
        if previous and previous[0] == published and previous[1] != generation:
            raise ValueError(
                f"Conflicting generation at {start}, publication {published}"
            )
        if previous is None or published >= previous[0]:
            indexed[key] = (published, generation)
    return indexed


class Analysis:
    def __init__(self, snapshot):
        self.forecasts = index_rows(snapshot["WINDFOR"], forecast=True)
        self.actuals = index_rows(snapshot["FUELHH"])
        # January WINDFOR is hourly. Refuse silently incompatible future snapshots.
        if any(start.minute != 0 or start.second != 0 for start, _ in self.forecasts):
            raise ValueError("Snapshot is not hourly WINDFOR; review alignment")
        self.days = {
            str(FIRST + timedelta(days=i)): self.decision(FIRST + timedelta(days=i))
            for i in range(31)
        }

    def decision(self, day):
        cutoff = datetime.combine(
            day, time(9, 50), ZoneInfo("Europe/London")
        ).astimezone(timezone.utc)
        delivery = day + timedelta(days=1)
        midnight = datetime.combine(delivery, time(), timezone.utc)
        selected = {}
        for (start, published), (_, generation) in self.forecasts.items():
            if midnight <= start < midnight + timedelta(days=1) and published <= cutoff:
                if start not in selected or published > selected[start][0]:
                    selected[start] = (published, generation)
        points = []
        for hour in range(24):
            start = midnight + timedelta(hours=hour)
            forecast = selected.get(start)
            actual_pair = [
                self.actuals.get(start),
                self.actuals.get(start + timedelta(minutes=30)),
            ]
            actual = sum(r[1] for r in actual_pair) / 2 if all(actual_pair) else None
            value = forecast[1] if forecast else None
            points.append(
                {
                    "startTime": iso(start),
                    "hour": f"{hour:02d}:00",
                    "forecastMw": value,
                    "actualMw": actual,
                    "publishTime": iso(forecast[0]) if forecast else None,
                    "ageHours": (cutoff - forecast[0]).total_seconds() / 3600
                    if forecast
                    else None,
                    "errorMw": value - actual
                    if value is not None and actual is not None
                    else None,
                }
            )
        available = [p["forecastMw"] for p in points if p["forecastMw"] is not None]
        return {
            "decisionDate": str(day),
            "deliveryDate": str(delivery),
            "cutoff": iso(cutoff),
            "points": points,
            "metrics": metrics(points),
            "forecastHours": len(available),
            "forecastEnergyMwh": sum(available) if available else None,
            "peakMw": max(available) if available else None,
            "minMw": min(available) if available else None,
        }

    def accuracy(self, first, last):
        days = [day for key, day in self.days.items() if first <= key <= last]
        return summarize_accuracy(days)
