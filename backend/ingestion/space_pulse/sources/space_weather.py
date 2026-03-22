"""
Space weather source — NOAA SWPC Kp-index and Auroral Oval ingestion.

Polls two NOAA SWPC endpoints:
  - Kp-index (1-minute cadence) every 15 minutes → Redis + TimescaleDB
  - Auroral Oval GeoJSON every 5 minutes         → Redis cache

Redis keys written:
  space_weather:kp_current    — latest Kp value as JSON
  space_weather:kp_history    — last 24h series as JSON array
  space_weather:aurora_geojson — NOAA 1-hour auroral forecast GeoJSON

TimescaleDB writes (psycopg2 via asyncio.to_thread):
  space_weather_kp hypertable — rolling 7-day Kp history
"""

import asyncio
import json
import logging
from datetime import datetime, UTC

import httpx
import psycopg2
from psycopg2.extras import execute_values

logger = logging.getLogger("space_pulse.space_weather")

KP_1M_URL  = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
AURORA_URL = "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
USER_AGENT = "SovereignWatch/1.0 (SpacePulse space weather)"
TIMEOUT    = 15.0

STORM_LEVELS = {
    0: "quiet", 1: "quiet", 2: "quiet",
    3: "unsettled", 4: "active",
    5: "G1", 6: "G2", 7: "G3", 8: "G4", 9: "G5",
}


def _kp_to_storm_level(kp: float) -> str:
    return STORM_LEVELS.get(int(kp), "G5" if kp >= 9 else "quiet")


def _store_kp_db_sync(db_url: str, rows: list[tuple]) -> None:
    """Persist Kp records to TimescaleDB (synchronous — call via asyncio.to_thread)."""
    conn = psycopg2.connect(db_url)
    try:
        cur = conn.cursor()
        execute_values(
            cur,
            """
            INSERT INTO space_weather_kp (time, kp, kp_fraction, storm_level, source)
            VALUES %s
            ON CONFLICT DO NOTHING
            """,
            rows,
            page_size=500,
        )
        conn.commit()
        cur.close()
    finally:
        conn.close()


class SpaceWeatherSource:
    def __init__(self, redis_client, db_url: str, aurora_interval_s: int, kp_interval_s: int):
        self.redis_client     = redis_client
        self.db_url           = db_url
        self.aurora_interval  = aurora_interval_s
        self.kp_interval      = kp_interval_s
        self._seen_kp_times: set[str] = set()

    async def run(self):
        last_kp     = 0.0
        last_aurora = 0.0

        while True:
            try:
                now = asyncio.get_event_loop().time()

                if now - last_kp >= self.kp_interval:
                    await self._poll_kp()
                    last_kp = now

                if now - last_aurora >= self.aurora_interval:
                    await self._poll_aurora()
                    last_aurora = now

            except Exception:
                logger.exception("Space weather poll error")

            await asyncio.sleep(30)

    async def _fetch_json(self, url: str):
        async with httpx.AsyncClient(
            timeout=TIMEOUT, headers={"User-Agent": USER_AGENT}
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()

    async def _poll_kp(self):
        logger.info("Polling Kp-index...")
        try:
            data = await self._fetch_json(KP_1M_URL)
        except Exception as exc:
            logger.error("Kp fetch failed: %s", exc)
            return

        records = []
        for row in data:
            if not isinstance(row, dict):
                continue
            time_tag = row.get("time_tag") or row.get("time")
            if not time_tag:
                continue
            try:
                kp_val = row.get("kp_index")
                if kp_val is None:
                    kp_val = row.get("estimated_kp", 0)
                if kp_val is None or isinstance(kp_val, str):
                    raw = str(row.get("kp", "0"))
                    numeric = "".join(c for c in raw if c.isdigit() or c == ".")
                    kp_val = float(numeric or 0)
                kp_frac = float(row.get("estimated_kp", kp_val) or kp_val)
                records.append({"time": time_tag, "kp": float(kp_val), "kp_fraction": kp_frac})
            except (TypeError, ValueError) as exc:
                logger.debug("Skipping invalid Kp row: %s", exc)

        if not records:
            logger.warning("No Kp records returned")
            return

        # Store latest + history in Redis
        latest = records[-1]
        kp_val = latest["kp"]
        storm  = _kp_to_storm_level(kp_val)
        current = {
            "kp": kp_val,
            "kp_fraction": latest.get("kp_fraction", kp_val),
            "storm_level": storm,
            "time": latest["time"],
            "fetched_at": datetime.now(UTC).isoformat(),
        }
        await self.redis_client.set("space_weather:kp_current", json.dumps(current))
        history = [
            {"time": r["time"], "kp": r["kp"], "storm_level": _kp_to_storm_level(r["kp"])}
            for r in records[-1440:]
        ]
        await self.redis_client.set("space_weather:kp_history", json.dumps(history))
        logger.info("Kp stored in Redis — latest: %.1f (%s)", kp_val, storm)

        # Persist new records to TimescaleDB
        new_records = [r for r in records if r["time"] not in self._seen_kp_times]
        if new_records:
            rows = [
                (r["time"], r["kp"], r.get("kp_fraction", r["kp"]),
                 _kp_to_storm_level(r["kp"]), "noaa_swpc_1m")
                for r in new_records
            ]
            try:
                await asyncio.to_thread(_store_kp_db_sync, self.db_url, rows)
                for r in new_records:
                    self._seen_kp_times.add(r["time"])
                if len(self._seen_kp_times) > 15_000:
                    self._seen_kp_times.clear()
                logger.info("Persisted %d Kp records to TimescaleDB", len(rows))
            except Exception as exc:
                logger.error("Kp DB write failed: %s", exc)

    async def _poll_aurora(self):
        logger.info("Polling Aurora GeoJSON...")
        try:
            data = await self._fetch_json(AURORA_URL)
        except Exception as exc:
            logger.error("Aurora fetch failed: %s", exc)
            return

        coords = data.get("coordinates", []) if isinstance(data, dict) else data
        if not coords:
            logger.warning("No aurora coordinates in response")
            return

        features = []
        for row in coords:
            if not isinstance(row, list) or len(row) < 3:
                continue
            try:
                lon       = float(row[0])
                lat       = float(row[1])
                intensity = float(row[2]) if row[2] is not None else 0.0
                if intensity < 5:
                    continue
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lon, lat]},
                    "properties": {"aurora": intensity},
                })
            except (TypeError, ValueError):
                continue

        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "fetched_at": datetime.now(UTC).isoformat(),
                "observation_time": data.get("Observation Time") if isinstance(data, dict) else None,
            },
        }
        await self.redis_client.set("space_weather:aurora_geojson", json.dumps(geojson))
        logger.info("Aurora GeoJSON stored in Redis (%d points)", len(features))
