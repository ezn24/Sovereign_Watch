# Release - v0.40.0 - Infrastructure Resilience

## Summary

This release introduces the **FCC Antenna Structure Registration (ASR)** dataset, providing operators with situational awareness of over 195,000 unique tower and antenna structures. To support this significant data expansion, the `infra-poller` architecture has been overhauled with a high-performance, persistent synchronization strategy that drastically reduces upstream API consumption and improves system stability.

## Key Features

- **FCC Tower Ingestion**: Comprehensive mapping of terrestrial antenna infrastructure across North America.
- **Weekly Cooldown Cycles**: Both FCC and Submarine Cable datasets now sync strictly every 7 days, avoiding redundant multi-megabyte downloads.
- **Boot-Safe Persistence**: Polling status is now persisted in Redis. If a service restarts, it will skip scheduled syncs if the data is already current.
- **Interactive Infrastructure Tooltips**: Improved interactivity for the new infrastructure layers, including registration details and status metadata.
- **Transparent Polling Diagnostics**: Real-time logs now show exactly when the next weekly sync is scheduled (e.g., "Next sync in 6d 23h").

## Technical Details

- **Ingestion**: Migrated from legacy `wireless2.fcc.gov` endpoints to modern `data.fcc.gov` APIs.
- **Parser Tuning**: Specialized DMS (Degrees-Minutes-Seconds) coordinate translation to ensure sub-meter mapping precision for structured tower data.
- **Rendering**: FCC towers utilize a Development Preview rendering mode with optimized Z-ordering and depth bias for Globe/3D views.

## Upgrade Instructions

Rebuild and restart the infrastructure poller to apply the new scheduling and ingestion logic:

```bash
git pull origin dev
docker compose up -d --build infra-poller
```
