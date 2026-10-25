"""Fixed pilot window and paths, shared by ingestion and the API."""

from datetime import date
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
FIRST = date(2026, 1, 1)
LAST = date(2026, 1, 31)
