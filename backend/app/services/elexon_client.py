"""Download auditable Elexon snapshots. Run: python -m backend.app.services.elexon_client."""

import hashlib
import json
import os
import time
from datetime import date, datetime, timedelta, timezone
from http.client import IncompleteRead
from tempfile import NamedTemporaryFile
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from ..config import DATA_DIR
from .forecast_selection import Analysis, index_rows, timestamp

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"


def fetch(url):
    for attempt in range(4):
        try:
            with urlopen(url, timeout=60) as response:
                return response.read()
        except HTTPError as error:
            error.close()
            if error.code != 429 and error.code < 500:
                raise
            if attempt == 3:
                raise
        except (URLError, TimeoutError, IncompleteRead):
            if attempt == 3:
                raise
        time.sleep(2**attempt)


def parse_response(payload, dataset, day):
    """Validate the documented flat JSON array and the requested daily window."""
    rows = json.loads(payload)
    if not isinstance(rows, list) or not rows:
        raise ValueError(f"Empty or invalid {dataset} response for {day}")
    indexed = index_rows(rows, forecast=dataset == "WINDFOR")
    if dataset == "FUELHH":
        midnight = timestamp(f"{day}T00:00:00Z")
        expected = {midnight + timedelta(minutes=30 * i) for i in range(48)}
        if any(row.get("fuelType") != "WIND" for row in rows):
            raise ValueError("FUELHH response contains non-WIND records")
        if set(indexed) != expected or any(
            value is None for _, value in indexed.values()
        ):
            raise ValueError(f"Incomplete FUELHH response for {day}")
    else:
        first = timestamp(f"{day}T00:00:00Z")
        last = first + timedelta(days=1)
        if any(not first <= published <= last for _, published in indexed):
            raise ValueError(f"WINDFOR publication outside requested window for {day}")
        if any(
            start.minute or start.second or start.microsecond for start, _ in indexed
        ):
            raise ValueError("WINDFOR response is not hourly")
    return rows


def validate_snapshot(snapshot):
    model = Analysis(snapshot)
    for day in model.days.values():
        if day["forecastHours"] != 24 or day["metrics"]["count"] != 24:
            raise ValueError(f"Incomplete decision coverage for {day['decisionDate']}")


def atomic_write(path, payload):
    """Avoid exposing partially written individual files."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with NamedTemporaryFile(dir=path.parent, delete=False) as output:
            temporary = output.name
            output.write(payload)
        os.replace(temporary, path)
    finally:
        if temporary and os.path.exists(temporary):
            os.unlink(temporary)


def main():
    manifest = {"retrievedAt": datetime.now(timezone.utc).isoformat(), "requests": []}
    combined = {"WINDFOR": [], "FUELHH": []}
    downloads = []
    for dataset, first, last in [
        ("WINDFOR", date(2025, 12, 25), date(2026, 1, 31)),
        ("FUELHH", date(2026, 1, 2), date(2026, 2, 1)),
    ]:
        day = first
        while day <= last:
            if dataset == "WINDFOR":
                params = {
                    "publishDateTimeFrom": f"{day}T00:00:00Z",
                    "publishDateTimeTo": f"{day + timedelta(days=1)}T00:00:00Z",
                }
            else:
                params = {
                    "settlementDateFrom": str(day),
                    "settlementDateTo": str(day),
                    "fuelType": "WIND",
                }
            url = f"{BASE}/{dataset}/stream?{urlencode(params)}"
            filename = f"{dataset}-{day}.json"
            payload = fetch(url)
            rows = parse_response(payload, dataset, day)
            downloads.append((DATA_DIR / "raw" / filename, payload))
            combined[dataset].extend(rows)
            manifest["requests"].append(
                {
                    "url": url,
                    "file": f"raw/{filename}",
                    "sha256": hashlib.sha256(payload).hexdigest(),
                    "rows": len(rows),
                }
            )
            print(f"{dataset} {day}: {len(rows)} rows", flush=True)
            day += timedelta(days=1)
    # Network and validation failures must leave the previous snapshot untouched.
    validate_snapshot(combined)
    for path, payload in downloads:
        atomic_write(path, payload)
    atomic_write(
        DATA_DIR / "snapshot.json",
        json.dumps(combined, separators=(",", ":"), allow_nan=False).encode("utf-8"),
    )
    atomic_write(
        DATA_DIR / "manifest.json", json.dumps(manifest, indent=2).encode("utf-8")
    )


if __name__ == "__main__":
    main()
