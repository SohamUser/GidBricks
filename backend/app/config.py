"""Fixed pilot window and paths, shared by ingestion and the API."""

import os
import re
from datetime import date, time
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
FIRST = date(2026, 1, 1)
LAST = date(2026, 1, 31)


def decision_cutoff(value=None):
    """UK local purchasing-time assumption, configured before starting the API."""
    value = os.getenv("DECISION_CUTOFF_LOCAL", "09:50") if value is None else value
    if not isinstance(value, str) or not re.fullmatch(
        r"(?:[01]\d|2[0-3]):[0-5]\d", value
    ):
        raise ValueError("DECISION_CUTOFF_LOCAL must use HH:MM (00:00 to 23:59)")
    return time.fromisoformat(value)
