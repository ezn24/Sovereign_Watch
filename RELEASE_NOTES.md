# Release - v0.44.0 - Orbital Fusion & Async Modernization

## High-Level Summary
This major update significantly enhances the platform's space domain situational awareness and infrastructure polling efficiency. By integrating the **SatNOGS** network and introducing a real-time **Pass Geometry HUD**, operators now have deep visibility into satellite transmitter statuses and upcoming overpass windows. Simultaneously, the backend ingestion architecture has been modernized for massive concurrency, ensuring the platform scales gracefully as new data sources are fused into the tactical picture.

## Key Features
- **SatNOGS Deep Integration**: Live transmitter catalog and ground-station observation cross-referencing for spectrum verification.
- **Floating Pass Geometry HUD**: Interactive polar plot providing real-time AOS/TCA/Next-Pass metadata for orbital objects.
- **Sovereign Glass UI Polish**: Improved visual balance with a centered Space Weather monitor and themed orbital widgets.
- **Async InfraPoller**: 100% async rewrite of infrastructure ingestion, offloading blocking I/O to thread pools for maximum performance.
- **Unified SpacePulse Service**: Consolidated orbital, weather, and SatNOGS pollers into a single, high-efficiency container.

## Technical Details
- **Backend**: Migrated from `requests` to `httpx` and added `redis.asyncio` support.
- **Frontend**: Extracted `SatelliteSpectrumVerification` component and implemented `PassGeometryWidget` with Deck.gl v9 alignment.
- **Schema**: Added `satnogs_transmitters` and `satnogs_observations` tables to the primary TimescaleDB instance.

## Upgrade Instructions
To deploy the new version, pull the latest changes and rebuild the consolidated space service:
```bash
docker compose pull
docker compose up -d --build sovereign-space-pulse sovereign-backend-api sovereign-infra-poller
```
