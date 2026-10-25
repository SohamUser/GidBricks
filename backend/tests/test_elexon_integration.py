"""Opt-in network tests: RUN_ELEXON_INTEGRATION=1; never refresh bundled data."""

import os
import unittest
from datetime import date, timedelta
from urllib.parse import urlencode

from app.services.elexon_client import BASE, fetch, parse_response


@unittest.skipUnless(
    os.getenv("RUN_ELEXON_INTEGRATION") == "1", "Live Elexon tests are opt-in"
)
class ElexonIntegrationTests(unittest.TestCase):
    def test_january_decision_boundary_data(self):
        for day in [date(2026, 1, 1), date(2026, 1, 31)]:
            with self.subTest(decision=day):
                params = {
                    "publishDateTimeFrom": f"{day}T00:00:00Z",
                    "publishDateTimeTo": f"{day + timedelta(days=1)}T00:00:00Z",
                }
                forecasts = parse_response(
                    fetch(f"{BASE}/WINDFOR/stream?{urlencode(params)}"), "WINDFOR", day
                )
                self.assertTrue(forecasts)
                delivery = day + timedelta(days=1)
                params = {
                    "settlementDateFrom": str(delivery),
                    "settlementDateTo": str(delivery),
                    "fuelType": "WIND",
                }
                actuals = parse_response(
                    fetch(f"{BASE}/FUELHH/stream?{urlencode(params)}"),
                    "FUELHH",
                    delivery,
                )
                self.assertEqual(len({r["startTime"] for r in actuals}), 48)
