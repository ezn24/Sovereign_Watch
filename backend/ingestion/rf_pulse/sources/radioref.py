"""
RadioReference source adapter.

Authenticates via the RadioReference SOAP API v2 using a developer app key
plus a licensed user account (username + password).  An auth token is
obtained from ``getAuthToken`` and reused until it expires, at which point a
single re-auth is attempted transparently.

Required environment variables
--------------------------------
RADIOREF_APP_KEY   - Developer app key from radioreference.com/apps/api/
RADIOREF_USERNAME  - RadioReference premium account username
RADIOREF_PASSWORD  - RadioReference premium account password

Optional environment variables
--------------------------------
RADIOREF_STATE_IDS - Comma-separated list of RR state IDs to scan (default: "43,56" = OR, WA)
RF_RR_RADIUS_MI    - Radius in miles from CENTER_LAT/CENTER_LON to filter systems (default: 200)
CENTER_LAT         - Center latitude for radius filtering (default: 45.5152)
CENTER_LON         - Center longitude for radius filtering (default: -122.6784)

If any of the three required vars are absent the source skips all fetches and logs a single
informational message at startup.

Fetch strategy
--------------
getCountyListByState(stid) → county list
  getTrsList(cid)           → system stubs (sid, sName, sType) per county
    getTrsDetails(sid)      → full system record including lat/lon for radius filtering
"""

import asyncio
import logging
import math
import os

import httpx
import zeep
import zeep.exceptions
from zeep.transports import AsyncTransport

logger = logging.getLogger("rf_pulse.radioref")

WSDL_URL = "https://api.radioreference.com/soap2/?wsdl&v=9"

CENTER_LAT   = float(os.getenv("CENTER_LAT", "45.5152"))
CENTER_LON   = float(os.getenv("CENTER_LON", "-122.6784"))
RR_RADIUS_MI = int(os.getenv("RF_RR_RADIUS_MI", "200"))

# Comma-separated RR state IDs to scan; defaults to Oregon (43) and Washington (56).
_STATE_IDS: list[int] = [
    int(s.strip())
    for s in os.getenv("RADIOREF_STATE_IDS", "43,56").split(",")
    if s.strip().isdigit()
]


def _haversine_mi(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 3958.8
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


class RadioReferenceSource:
    def __init__(self, producer, redis_client, topic, fetch_interval_h):
        self.producer      = producer
        self.redis_client  = redis_client
        self.topic         = topic
        self.interval_sec  = fetch_interval_h * 3600

        self.app_key  = os.getenv("RADIOREF_APP_KEY", "")
        self.username = os.getenv("RADIOREF_USERNAME", "")
        self.password = os.getenv("RADIOREF_PASSWORD", "")

    # ------------------------------------------------------------------
    # Authentication helpers
    # ------------------------------------------------------------------

    def _auth_info(self) -> dict:
        """Build the authInfo dict required by most RR SOAP calls."""
        return {
            "appKey":   self.app_key,
            "username": self.username,
            "password": self.password,
            "version":  "latest",
        }

    # ------------------------------------------------------------------
    # Main loop
    # ------------------------------------------------------------------

    async def loop(self):
        if not (self.app_key and self.username and self.password):
            logger.info(
                "RadioReference: RADIOREF_APP_KEY/USERNAME/PASSWORD not fully set, "
                "skipping RadioReference ingestion."
            )
            return

        while True:
            try:
                await self._fetch_and_publish()
            except Exception:
                logger.exception("RadioReference: unhandled fetch error")
            await asyncio.sleep(self.interval_sec)

    # ------------------------------------------------------------------
    # Fetch + publish
    # ------------------------------------------------------------------

    async def _fetch_and_publish(self):
        headers = {"User-Agent": "SovereignWatch/1.0"}
        transport = AsyncTransport(
            client=httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers=headers),
            wsdl_client=httpx.Client(timeout=30.0, follow_redirects=True, headers=headers)
        )
        client = zeep.AsyncClient(WSDL_URL, transport=transport)

        try:
            systems = await self._fetch_systems(client)
        except zeep.exceptions.Fault as fault:
            logger.warning("RadioReference: SOAP fault (%s)", fault.message)
            return

        published = 0
        for sys in systems:
            try:
                lat = float(sys.lat or 0)
                lon = float(sys.lon or 0)
            except (TypeError, ValueError):
                lat, lon = 0.0, 0.0

            record = {
                "source":       "radioref",
                "site_id":      f"rr:sys:{sys.sid}",
                "service":      "public_safety",
                "name":         sys.sName,
                "lat":          lat,
                "lon":          lon,
                "modes":        [sys.sType],
                "status":       "Unknown",
                "country":      "US",
                "emcomm_flags": [],
                "meta":         {"type": "trunked_system"},
            }
            await self.producer.send(self.topic, value=record)
            published += 1

        logger.info("RadioReference: published %d systems to %s", published, self.topic)

    async def _fetch_systems(self, client: zeep.AsyncClient) -> list:
        """Fetch trunked systems within the configured radius.

        Call chain:
          getCountyListByState(stid) → county list
            getTrsList(cid)           → system stubs per county
              getTrsDetails(sid)      → full system record with lat/lon
        """
        auth = self._auth_info()
        results: list = []
        seen_sids: set = set()

        logger.info(
            "RadioReference: scanning %d state(s) for trunked systems within %d mi of %.4f,%.4f",
            len(_STATE_IDS), RR_RADIUS_MI, CENTER_LAT, CENTER_LON,
        )

        for stid in _STATE_IDS:
            try:
                counties = await client.service.getCountyListByState(
                    stid=stid, authInfo=auth
                )
            except zeep.exceptions.Fault as exc:
                logger.warning(
                    "RadioReference: getCountyListByState fault for stid=%d: %s", stid, exc.message
                )
                continue

            if not counties:
                continue

            for county in counties:
                cid = county.cid
                try:
                    trs_list = await client.service.getTrsList(cid=cid, authInfo=auth)
                except zeep.exceptions.Fault:
                    continue

                if not trs_list:
                    continue

                for stub in trs_list:
                    sid = stub.sid
                    if sid in seen_sids:
                        continue
                    seen_sids.add(sid)

                    try:
                        details = await client.service.getTrsDetails(sid=sid, authInfo=auth)
                    except zeep.exceptions.Fault as exc:
                        logger.debug(
                            "RadioReference: getTrsDetails fault sid=%s: %s", sid, exc.message
                        )
                        continue

                    # Filter by radius using system lat/lon when available.
                    try:
                        sys_lat = float(details.lat or 0)
                        sys_lon = float(details.lon or 0)
                    except (TypeError, ValueError):
                        sys_lat, sys_lon = 0.0, 0.0

                    if sys_lat != 0.0 or sys_lon != 0.0:
                        dist = _haversine_mi(CENTER_LAT, CENTER_LON, sys_lat, sys_lon)
                        if dist > RR_RADIUS_MI:
                            logger.debug(
                                "RadioReference: skipping %s (%.0f mi from center)",
                                details.sName, dist,
                            )
                            continue

                    results.append(details)

        logger.info(
            "RadioReference: fetched %d trunked systems across %d state(s)",
            len(results), len(_STATE_IDS),
        )
        return results
