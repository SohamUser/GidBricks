"""Error metrics and pair-weighted summaries, in MW."""

import math


def metrics(points):
    matched = [
        p for p in points if p["errorMw"] is not None and math.isfinite(p["errorMw"])
    ]
    errors = [p["errorMw"] for p in matched]
    percentage_errors = [
        abs(p["errorMw"]) / abs(p["actualMw"]) * 100
        for p in matched
        if p.get("actualMw") is not None
        and math.isfinite(p["actualMw"])
        and p["actualMw"] != 0
    ]
    percentage_metrics = {
        "mape": sum(percentage_errors) / len(percentage_errors)
        if percentage_errors
        else None,
        "mapeCount": len(percentage_errors),
        "mapeExcludedCount": len(points) - len(percentage_errors),
    }
    if not errors:
        return {
            "count": 0,
            "mae": None,
            "rmse": None,
            "bias": None,
            "p90": None,
            **percentage_metrics,
        }
    absolute = sorted(abs(e) for e in errors)
    return {
        "count": len(errors),
        "mae": sum(absolute) / len(errors),
        "rmse": math.sqrt(sum(e * e for e in errors) / len(errors)),
        "bias": sum(errors) / len(errors),
        "p90": absolute[math.ceil(0.9 * len(errors)) - 1],
        **percentage_metrics,
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
