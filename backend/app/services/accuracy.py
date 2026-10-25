"""Error metrics and pair-weighted summaries, in MW."""

import math


def metrics(points):
    errors = [p["errorMw"] for p in points if p["errorMw"] is not None]
    if not errors:
        return {"count": 0, "mae": None, "rmse": None, "bias": None, "p90": None}
    absolute = sorted(abs(e) for e in errors)
    return {
        "count": len(errors),
        "mae": sum(absolute) / len(errors),
        "rmse": math.sqrt(sum(e * e for e in errors) / len(errors)),
        "bias": sum(errors) / len(errors),
        "p90": absolute[math.ceil(0.9 * len(errors)) - 1],
    }


def summarize_accuracy(days):
    points = [p for day in days for p in day["points"]]
    return {
        "metrics": metrics(points),
        "expectedHours": len(days) * 24,
        "days": [
            {
                "decisionDate": d["decisionDate"],
                "deliveryDate": d["deliveryDate"],
                **d["metrics"],
            }
            for d in days
        ],
        "byHour": [
            {
                "hour": f"{h:02d}:00",
                **metrics([p for p in points if p["hour"] == f"{h:02d}:00"]),
            }
            for h in range(24)
        ],
    }
