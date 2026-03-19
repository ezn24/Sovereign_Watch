# Issue
The `adsb-poller` service in `docker-compose.yml` did not pass OpenSky configuration variables into the aviation poller container. As a result, OpenSky features (bbox and watchlist modes) could not be enabled/configured through `.env` when running under Docker Compose.

# Solution
Added the full OpenSky-related environment variable set to the `adsb-poller` service, mapped from compose variable expansion with sensible defaults.

# Changes
- Modified `docker-compose.yml` under `services.adsb-poller.environment`:
  - Added `OPENSKY_ENABLED`
  - Added `OPENSKY_CLIENT_ID`
  - Added `OPENSKY_CLIENT_SECRET`
  - Added `OPENSKY_RATE_LIMIT_PERIOD`
  - Added `OPENSKY_WATCHLIST_ENABLED`
  - Added `OPENSKY_WATCHLIST_AUTO_SEED`
  - Added `OPENSKY_WATCHLIST_SEED_TYPES`
  - Added `OPENSKY_WATCHLIST_TTL_DAYS`
  - Added `OPENSKY_WATCHLIST_BATCH_SIZE`

# Verification
- `docker compose config` succeeds (compose file parses and environment section is valid).

# Benefits
- OpenSky integration can now be configured via `.env` for Docker Compose deployments.
- Enables authenticated and anonymous OpenSky modes without image changes.
- Enables watchlist controls and rate-limit override in containerized runs.
