"""Download auditable Elexon snapshots. Run: python -m backend.app.services.elexon_client."""

import hashlib
import json
import time
from datetime import date, datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from ..config import DATA_DIR

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"


def fetch(url):
    for attempt in range(4):
        try:
            with urlopen(url, timeout=60) as response:
                return response.read()
        except HTTPError as error:
            if error.code != 429 and error.code < 500:
                raise
            if attempt == 3:
                raise
        except (URLError, TimeoutError):
            if attempt == 3:
                raise
        time.sleep(2**attempt)


def main():
    raw_dir = DATA_DIR / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"retrievedAt": datetime.now(timezone.utc).isoformat(), "requests": []}
    combined = {"WINDFOR": [], "FUELHH": []}
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
            path = raw_dir / filename
            payload = fetch(url)
            rows = json.loads(payload)
            if not isinstance(rows, list):
                raise ValueError(f"Unexpected response from {url}")
            path.write_bytes(payload)
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
    (DATA_DIR / "snapshot.json").write_text(
        json.dumps(combined, separators=(",", ":")), encoding="utf-8"
    )
    (DATA_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
