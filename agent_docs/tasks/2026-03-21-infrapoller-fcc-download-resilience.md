# 2026-03-21-infrapoller-fcc-download-resilience.md

## Issue
The FCC Tower data download (~35 MB) in `sovereign-infra-poller` appeared "stuck" for several minutes. Investigation revealed that the FCC servers were responding slowly (approx 80-100 KB/s), and the 8 MB chunk size combined with `DEBUG` level logging left the user without visibility into the download progress. Additionally, a hang beyond the 120s timeout was possible due to large chunk buffering in `requests`.

## Solution
Improved the visibility and resilience of the FCC download process:
- Reduced `FCC_DOWNLOAD_CHUNK_BYTES` from 8 MB to 1 MB to ensure more frequent yielding of the `iter_content` loop.
- Changed the progress log message level from `DEBUG` to `INFO` so it's visible in standard container logs.
- Reduced `FCC_READ_TIMEOUT_S` to 60s and increased `FCC_MAX_RETRIES` to 5 to handle flaky server behavior more aggressively.

## Changes
- `backend/ingestion/infra_poller/main.py`: Updated constants and logging in `_download_fcc_zip`.

## Verification
- Rebuilt `sovereign-infra-poller` container.
- Monitored `docker compose logs sovereign-infra-poller` and observed incremental progress messages (1.0 MB, 2.0 MB, etc.) being logged in real-time.

## Benefits
- Provides clear visibility into the long-running FCC download task.
- Makes the download more resilient to slow or dropping server connections from data.fcc.gov.
