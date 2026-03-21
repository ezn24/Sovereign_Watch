# 2026-03-21 — Ingest-05: SatNOGS Integration (Spectrum Verification)

## Issue

The platform lacked a cross-domain spectrum verification capability. While `orbital_pulse` tracks satellite positions via TLE propagation, there was no mechanism to verify that satellites are actively transmitting on their registered frequencies — a critical indicator for detecting anomalies such as:

- Silent satellites (expected transmitter not observed)
- Off-frequency transmissions (possible interference, spoofing, or hardware degradation)
- Rogue transmissions on satellite frequencies

## Solution

Integrated [SatNOGS](https://satnogs.org/) — the global open-source satellite ground-station network — as a new ingestion pipeline. SatNOGS provides two public APIs:

1. **SatNOGS DB** (`db.satnogs.org/api/`) — Satellite transmitter catalog: expected downlink/uplink frequencies and modulation modes per NORAD ID.
2. **SatNOGS Network** (`network.satnogs.org/api/`) — Ground-station observation records: actual signals received during satellite passes, including observed frequency and signal quality.

Cross-referencing observations against the transmitter catalog (within ±5 kHz Doppler tolerance) enables automated spectrum verification per satellite.

## Changes

### New: `backend/ingestion/satnogs_pulse/`

New poller service following the established `rf_pulse` multi-source pattern:

| File | Purpose |
|------|---------|
| `main.py` | Service entry point, signal handlers |
| `service.py` | `SatNOGSPulseService` — Kafka producer + Redis setup, source orchestration |
| `sources/satnogs_db.py` | `SatNOGSDBSource` — Fetches active transmitter catalog daily; handles pagination |
| `sources/satnogs_network.py` | `SatNOGSNetworkSource` — Fetches recent (6h window) good observations hourly; in-memory dedup |
| `pyproject.toml` | Dependencies: `aiokafka`, `redis`, `httpx` |
| `Dockerfile` | `python:3.12-slim` + uv, mirrors `space_weather_pulse` pattern |
| `tests/test_satnogs_db.py` | Unit tests for transmitter normalisation logic |
| `tests/test_satnogs_network.py` | Unit tests for observation normalisation logic |

**Kafka topics produced:**
- `satnogs_transmitters` — one record per transmitter (uuid-keyed, upserted daily)
- `satnogs_observations` — one record per observation (observation_id-keyed, hourly)

**Configurable intervals (env vars):**
- `SATNOGS_DB_INTERVAL_H` (default: 24) — transmitter catalog refresh
- `SATNOGS_NETWORK_INTERVAL_H` (default: 1) — observation polling

### Modified: `backend/db/init.sql`

Added two new tables:

- **`satnogs_transmitters`** — Static reference table mapping NORAD IDs to their SatNOGS-registered frequencies and modes. PK: `uuid` (SatNOGS transmitter UUID).
- **`satnogs_observations`** — TimescaleDB hypertable (partitioned by `time`, 1-day chunks, 30-day retention). Records each satellite pass observation from the network. Unique constraint on `(observation_id, time)`.

Indices support fast lookups by `norad_id`, `ground_station_id`, and `frequency`.

### Modified: `backend/api/services/historian.py`

Extended the Kafka consumer to include `satnogs_transmitters` and `satnogs_observations` topics:

- **`satnogs_transmitters`**: Batched upsert (100 records / 2s flush) into `satnogs_transmitters` via `ON CONFLICT (uuid) DO UPDATE`.
- **`satnogs_observations`**: Per-message insert into `satnogs_observations` hypertable via `ON CONFLICT (observation_id, time) DO NOTHING` (idempotent).
- Shutdown flush for the transmitter batch added to the `finally` block.

Consumer group remains `historian-writer-v2` (adding topics to an existing group is backward-compatible).

### New: `backend/api/routers/satnogs.py`

Three FastAPI endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/satnogs/transmitters` | Query transmitter catalog with optional `norad_id`, `mode`, `alive_only` filters |
| `GET /api/satnogs/observations` | Query recent observations with optional `norad_id`, `ground_station_id`, `hours` filters |
| `GET /api/satnogs/verify/{norad_id}` | Spectrum verification summary: cross-references observations against catalog with ±5 kHz Doppler tolerance, flags anomalous observations |

All endpoints use Redis caching (1h for transmitters, 5min for observations/verify).

### Modified: `backend/api/main.py`

Imported and registered the `satnogs` router.

### Modified: `docker-compose.yml`

Added `sovereign-satnogs-pulse` service (depends on `sovereign-redpanda` + `sovereign-redis`).

## Verification

```bash
# Unit tests (host)
cd backend/ingestion/satnogs_pulse && python -m pytest tests/ -v

# Lint (host)
cd backend/api && ruff check routers/satnogs.py services/historian.py main.py
cd backend/ingestion/satnogs_pulse && ruff check .

# Container build (required for runtime validation)
docker compose build sovereign-satnogs-pulse
```

## Benefits

- **Spectrum verification**: The `GET /api/satnogs/verify/{norad_id}` endpoint provides a fused view of expected vs. observed frequencies — the first cross-INT (orbital + spectrum) correlation in the platform.
- **Anomaly detection foundation**: The `anomaly: true` flag on observations where frequency doesn't match catalog enables downstream alerting.
- **Zero-credential pipeline**: Both SatNOGS APIs are fully public; no API keys required.
- **Low overhead**: Transmitter catalog is fetched once daily (~5k records); observations are bounded to a 6-hour window per hourly poll.
- **Consistent architecture**: Follows the established poller pattern (aiokafka + redis cooldown + httpx + pagination).
