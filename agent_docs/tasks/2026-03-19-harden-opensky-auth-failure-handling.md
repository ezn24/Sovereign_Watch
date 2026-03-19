# Issue
`adsb-poller` logs showed OpenSky OAuth token refresh failing with `401 Unauthorized`, but startup still reported authenticated mode and token refresh was retried on every fetch, causing noisy repeated errors.

# Solution
Hardened OpenSky authentication handling to:
- Fall back cleanly to anonymous mode when token retrieval fails.
- Apply retry backoff for token refresh failures to prevent log spam.
- Improve error diagnostics with HTTP status and response preview.
- Trim OpenSky credential env values to avoid hidden whitespace causing invalid credentials.

# Changes
- Modified `backend/ingestion/aviation_poller/opensky_client.py`
  - Added token refresh backoff (`_next_token_retry_at`) with a 5-minute retry delay after failures.
  - Updated startup logging to reflect effective mode (`authenticated` only when token exists, otherwise `anonymous`).
  - Added warning when credentials are provided but token retrieval fails.
  - Added detailed 4xx token error logging including status and response preview.
  - Added explicit hint to verify `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` OAuth2 credentials.
- Modified `backend/ingestion/aviation_poller/service.py`
  - Trimmed `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` with `.strip()`.

# Verification
Executed once from `backend/ingestion/aviation_poller`:
- `uvx ruff check opensky_client.py service.py tests/test_opensky_client.py tests/test_opensky_watchlist.py`
- `uv run pytest tests/test_opensky_client.py tests/test_opensky_watchlist.py`

Result:
- Ruff: all checks passed.
- Pytest: `55 passed`.

# Benefits
- Prevents repeated token-refresh error storms when credentials are invalid.
- Makes runtime mode and failure cause explicit in logs.
- Reduces risk of auth failures caused by accidental whitespace in env values.
- Keeps OpenSky ingestion functional via anonymous fallback while auth is corrected.
