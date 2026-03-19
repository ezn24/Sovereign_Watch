# Release - v0.38.0 - OpenSky Global Tracking

## Summary

v0.38.0 introduces OpenSky Network integration as an optional supplemental aviation source, including a global ICAO24 watchlist that can continue tracking target aircraft beyond the local mission area.

This release adds:
- OpenSky OAuth2/anonymous API client support.
- OpenSky state-vector translation into the existing ADS-B normalization pipeline.
- Redis-backed watchlist tracking with TTL and auto-seeding.
- Docker Compose wiring for all OpenSky runtime environment variables.
- Hardened authentication failure handling with anonymous fallback and retry backoff.

---

## New Capabilities

### OpenSky Supplemental Ingestion

The aviation poller can now query OpenSky in parallel with ADSBx-compatible sources:
- Bounding-box OpenSky polling for mission-area coverage.
- Global watchlist polling for specific ICAO24 targets (no bbox restriction).

OpenSky native state vectors are translated to the existing ADS-B shape before
classification and TAK emission, so downstream systems required no interface
changes.

### Global ICAO24 Watchlist

Introduced a Redis-backed watchlist manager:
- O(log N) add/remove operations.
- Expiry-aware active-entry queries.
- Permanent entries for manually pinned aircraft.
- Auto-seeding from mission-area detections (default: military/government/drone).

### Auth Failure Hardening

OpenSky token behavior has been hardened:
- Startup mode now reflects effective auth state.
- Invalid OAuth credentials fall back to anonymous mode.
- Token-refresh failures use retry backoff to avoid log storms.
- Credential env values are whitespace-trimmed before use.

---

## Configuration

The `adsb-poller` compose service now accepts the full OpenSky configuration set:
- `OPENSKY_ENABLED`
- `OPENSKY_CLIENT_ID`
- `OPENSKY_CLIENT_SECRET`
- `OPENSKY_RATE_LIMIT_PERIOD`
- `OPENSKY_WATCHLIST_ENABLED`
- `OPENSKY_WATCHLIST_AUTO_SEED`
- `OPENSKY_WATCHLIST_SEED_TYPES`
- `OPENSKY_WATCHLIST_TTL_DAYS`
- `OPENSKY_WATCHLIST_BATCH_SIZE`

See [.env.example](.env.example) for recommended defaults and descriptions.

---

## Upgrade Instructions

```bash
# Pull latest changes
git pull origin dev

# Set OpenSky values in .env (optional for anonymous mode)
# OPENSKY_ENABLED=true
# OPENSKY_WATCHLIST_ENABLED=true
# OPENSKY_CLIENT_ID=...
# OPENSKY_CLIENT_SECRET=...

# Rebuild and restart the aviation poller
docker compose up -d --build adsb-poller

# Verify service health / logs
docker compose logs -f adsb-poller
```

---

## Verification Snapshot

- OpenSky targeted lint/tests: passed
- `tests/test_opensky_client.py` and `tests/test_opensky_watchlist.py`: 55 passed

---

For a full change list, see [CHANGELOG.md](CHANGELOG.md).
