# FCC Towers Ingestion Fix

**Date:** 2026-03-19

## Issue

The `infra-poller` service was failing to ingest and render FCC Antenna Structure Registration (ASR) tower data. Six separate bugs were identified and resolved.

---

## Technical Debt Fixed

### 1. Broken FCC Source URL (Fatal)
The FCC migrated their ASR bulk data from `wireless2.fcc.gov` to `data.fcc.gov`. The old URL returned 404.
- **New URL:** `https://data.fcc.gov/download/pub/uls/complete/r_tower.zip` (~37 MB).
- **Architecture:** Replaced `response.content` (memory-buffering) with chunked streaming to a temporary file + 3-attempt retry logic.

### 2. Stale CO.dat Column Parser (Fatal)
The new FCC archive uses separate degree/minute/second fields instead of the legacy packed DMS string format.
- **Fix:** Replaced the `convert_coord` regex-style parser with `dms_to_decimal` logic reading from columns `[6-9]` and `[11-14]`.

### 3. Schema Mismatch in SQL INSERT (Fatal)
The ingestion script was using `registration_number` instead of the `fcc_id` column defined in `init.sql`.
- **Fix:** Synchronized `main.py` columns with `infra_towers` schema (fcc_id, height_m, elevation_m, geom).

### 4. Missing Database Configuration (Fatal)
`infra-poller` lacked a `DATABASE_URL` in `docker-compose.yml`, causing it to connect to an incorrect default.
- **Fix:** Added `DATABASE_URL` and `depends_on: timescaledb` healthcheck to orchestration.

### 5. Duplicate Key Constraints
`CO.dat` contains multiple coordinate entries for the same registration. PostgreSQL errors on `ON CONFLICT` if the same key appears twice in one batch.
- **Fix:** Implemented pre-ingestion deduplication using a dictionary.

### 6. Missing Rendering z-ordering (Visual)
The original `buildTowerLayer.ts` lacked `depthBias` and `depthTest` parameters, causing markers to flicker or hide in Mercator/Globe modes.
- **Fix:** Updated layer to use `depthBias: -105.0` and `parameters: { depthTest: !!globeMode }`.

---

## Verification Results

- **Ingestion Count:** 195,592 unique towers.
- **Backend API:** `/api/infra/towers` confirmed serving JSON (HTTP 200).
- **UI:** FCC Towers render as orange dots (#F97316) with interactive tooltips.

```sql
SELECT COUNT(*) FROM infra_towers; -- 195592
```

## Benefits
- Comprehensive situational awareness of regional RF infrastructure.
- High-performance chunked download reduces bandwidth and improves poller reliability.
- Full compatibility with Globe and 3D Mercator camera projections.
