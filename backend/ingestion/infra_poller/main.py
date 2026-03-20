import math
import os
import json
import time
import logging
import requests
import redis
import traceback
import zipfile
import csv
import io
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timezone

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("InfraPoller")

# Config
REDIS_URL = os.getenv("REDIS_URL", "redis://sovereign-redis:6379/0")
DB_URL = os.getenv("DATABASE_URL", "postgresql://sovereign:watch@sovereign-db:5432/sovereign")
POLL_INTERVAL_CABLES_HOURS = 24
POLL_INTERVAL_IODA_MINUTES = 30
POLL_INTERVAL_FCC_DAYS = 7
FCC_TOWERS_URL = "https://wireless2.fcc.gov/UlsApp/AsrSearch/res/downloads/l_tower.zip"

# IODA
IODA_URL = "https://api.ioda.inetintel.cc.gatech.edu/v2/outages/summary"

# Submarine Cables
CABLES_URL = "https://www.submarinecablemap.com/api/v3/cable/cable-geo.json"
STATIONS_URL = "https://www.submarinecablemap.com/api/v3/landing-point/landing-point-geo.json"

# Connect to Redis
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

# Geocoding Cache
_region_geocode_cache = {}

def geocode_region(region_name: str, country_code: str):
    cache_key = f"{region_name},{country_code}"
    if cache_key in _region_geocode_cache:
        return _region_geocode_cache[cache_key]

    try:
        query = f"{region_name}, {country_code}"
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": query, "format": "json", "limit": 1}
        headers = {"User-Agent": "SovereignWatch/1.0 (InfraPoller)"}
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            _region_geocode_cache[cache_key] = (lat, lon)
            time.sleep(1) # Be nice to Nominatim
            return (lat, lon)
    except Exception as e:
        logger.error(f"Geocoding failed for {query}: {e}")

    # Fallback default if geocoding fails
    _region_geocode_cache[cache_key] = (0.0, 0.0)
    return (0.0, 0.0)

def fetch_internet_outages():
    logger.info("Fetching Internet Outage Summary from IODA...")
    try:
        # Get last 24h in UTC
        now = int(time.time())
        from_time = now - (24 * 3600)

        params = {
            "from": from_time,
            "until": now,
            "entityType": "country"
        }
        
        resp = requests.get(IODA_URL, params=params, timeout=30)
        resp.raise_for_status()
        
        data = resp.json().get("data", [])
        
        outages = []
        for entry in data:
            entity = entry.get("entity", {})
            if not entity:
                continue
                
            scores = entry.get("scores", {})
            # Use 'overall' score for severity
            overall_score = scores.get("overall", 0)
            if overall_score < 1000: # Ignore very minor noise
                continue

            # Check for IR
            country_code = entity.get("code", "")
            country_name = entity.get("name", country_code)
            
            # Normalize overall_score to 0-100 severity
            # Based on IODA scores (e.g., 350G is 3.5e11), we'll use a log scale
            # log10(1,000) = 3 -> 10% severity
            # log10(1,000,000,000,000) = 12 -> 100% severity
            log_score = math.log10(max(1, overall_score))
            severity = (log_score / 12.0) * 100
            severity = max(0, min(100, severity))

            # Geocode
            lat, lon = geocode_region(country_name, country_code)
            if lat == 0.0 and lon == 0.0:
                continue

            outages.append({
                "type": "Feature",
                "properties": {
                    "id": f"outage-{country_code}",
                    "region": country_name,
                    "country": country_name,
                    "country_code": country_code,
                    "severity": round(severity, 1),
                    "datasource": "IODA_OVERALL",
                    "entity_type": "country",
                    "score_raw": overall_score
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
            })

            if len(outages) >= 200:
                break

        geojson = {"type": "FeatureCollection", "features": outages}
        redis_client.set("infra:outages", json.dumps(geojson))
        logger.info(f"Stored {len(outages)} internet outages in Redis from Summary.")

    except Exception as e:
        logger.error(f"Failed to fetch internet outages from summary: {e}")
        traceback.print_exc()


def fetch_cables_and_stations():
    logger.info("Fetching Submarine Cables and Landing Stations...")
    try:
        cables_resp = requests.get(CABLES_URL, timeout=30)
        cables_resp.raise_for_status()
        redis_client.set("infra:cables", json.dumps(cables_resp.json()))
        logger.info("Stored submarine cables in Redis.")

        stations_resp = requests.get(STATIONS_URL, timeout=30)
        stations_resp.raise_for_status()
        redis_client.set("infra:stations", json.dumps(stations_resp.json()))
        logger.info("Stored landing stations in Redis.")

    except Exception as e:
        logger.error(f"Failed to fetch cables/stations: {e}")

def convert_coord(coord_str, dir_str):
    if not coord_str or not dir_str:
        return None
    try:
        coord_str = coord_str.strip()
        dir_str = dir_str.strip().upper()
        if len(coord_str) < 7:
            return None

        degrees = int(coord_str[0:2])
        if len(coord_str) == 9: # Longitude format
            degrees = int(coord_str[0:3])
            coord_str = coord_str[1:] # Shift so minutes/seconds align

        minutes = int(coord_str[2:4])
        seconds = float(coord_str[4:])

        decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)

        if dir_str in ['S', 'W']:
            decimal = -decimal

        return decimal
    except Exception:
        return None

def fetch_and_ingest_fcc_towers():
    logger.info("Starting FCC Towers ingestion...")
    try:
        # Download the zip file
        response = requests.get(FCC_TOWERS_URL, stream=True)
        response.raise_for_status()

        records = []

        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            # We are interested in the CO.dat file which contains coordinates
            if 'CO.dat' not in z.namelist():
                logger.error("CO.dat not found in FCC towers zip")
                return

            with z.open('CO.dat') as f:
                content = f.read().decode('latin1')
                reader = csv.reader(io.StringIO(content), delimiter='|')
                for row in reader:
                    # CO.dat format has specific fields. We need to extract:
                    # Registration Number, Lat/Lon, Elevation, Height
                    if len(row) < 15:
                        continue

                    record_type = row[0]
                    if record_type != 'CO':
                        continue

                    reg_num = row[4].strip()
                    if not reg_num:
                        continue

                    lat_deg, lat_dir = row[6], row[7]
                    lon_deg, lon_dir = row[8], row[9]

                    lat = convert_coord(lat_deg, lat_dir)
                    # Longitudes are 3 digits for degrees
                    lon_full = None
                    if lon_deg:
                        # Pad to 9 chars if it's 8
                        if len(lon_deg) == 8:
                            lon_deg = "0" + lon_deg
                        lon = convert_coord(lon_deg, lon_dir)
                    else:
                        lon = None

                    if lat is None or lon is None:
                        continue

                    # Elevation and Height
                    try:
                        elevation = float(row[14]) if row[14].strip() else None
                        height = float(row[15]) if row[15].strip() else None
                    except ValueError:
                        elevation, height = None, None

                    records.append((
                        reg_num,
                        lat,
                        lon,
                        elevation,
                        height
                    ))

        if not records:
            logger.warning("No valid FCC tower records found.")
            return

        # Insert into DB
        logger.info(f"Connecting to DB to insert {len(records)} towers...")
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()

        # Upsert logic
        insert_query = """
            INSERT INTO infra_towers (registration_number, lat, lon, elevation, height, location)
            VALUES %s
            ON CONFLICT (registration_number) DO UPDATE SET
                lat = EXCLUDED.lat,
                lon = EXCLUDED.lon,
                elevation = EXCLUDED.elevation,
                height = EXCLUDED.height,
                location = EXCLUDED.location,
                last_updated = CURRENT_TIMESTAMP;
        """

        # Prepare data with PostGIS points
        psycopg2_records = [
            (
                r[0], r[1], r[2], r[3], r[4],
                f"SRID=4326;POINT({r[2]} {r[1]})"
            )
            for r in records
        ]

        execute_values(cursor, insert_query, psycopg2_records, page_size=1000)
        conn.commit()
        cursor.close()
        conn.close()
        logger.info("Successfully ingested FCC Towers.")

    except Exception as e:
        logger.error(f"Failed to ingest FCC towers: {e}")
        traceback.print_exc()

def main():
    logger.info("Starting InfraPoller...")

    last_ioda_fetch = 0
    last_cables_fetch = 0
    last_fcc_fetch = 0

    while True:
        now = time.time()

        if now - last_cables_fetch > POLL_INTERVAL_CABLES_HOURS * 3600:
            fetch_cables_and_stations()
            last_cables_fetch = now

        if now - last_ioda_fetch > POLL_INTERVAL_IODA_MINUTES * 60:
            fetch_internet_outages()
            last_ioda_fetch = now

        if now - last_fcc_fetch > POLL_INTERVAL_FCC_DAYS * 86400:
            fetch_and_ingest_fcc_towers()
            last_fcc_fetch = now

        time.sleep(60)

if __name__ == "__main__":
    main()
