# Release - v0.29.1 - Stability & Refinement

## High-Level Summary
This release focuses on platform stability, operational data portability, and enhanced system monitoring. Key improvements include the introduction of the System Health monitoring suite, mission configuration presets, and critical performance optimizations for AI Analysis and global infrastructure layers.

## Key Features
- **Data Portability & Mission Presets**: Operators can now save their active layer configurations as named "Mission Presets". These can be exported as JSON files and imported across different nodes to ensure operational consistency.
- **Granular System Health**: The new System Health widget in the TopBar provides real-time connectivity status for individual data streams (Aviation, Maritime, Orbital, RF sources, and AI).
- **Tactical Quick-Presets**: Integrated one-click switches for "Air Only", "Sea Only", and "Full Intelligence" modes to allow rapid context switching during high-load operations.
- **AI Analyst Hardening**: Fixed a high-frequency polling bug and implemented a **Sentinel** rate-limiting layer on the backend to ensure API stability.
- **Optimized Infrastructure View**: Internet outage polygons now use client-side simplification, enabling smooth 60fps interaction even with complex global datasets.

## Technical Details
- **Security**: Added rate-limiting (Sentinel) to the AI Analysis endpoint to mitigate abuse.
- **Frontend**: Resolved `react/jsx-runtime` resolution errors and fixed "used before declaration" lint errors in the AI Analyst panel.
- **Rendering**: Standardized depth-biasing across the tactical stack to prevent z-fighting between infrastructure layers and the 3D globe terrain.
- **Ingestion**: Hardened the maritime poller with improved event sequencing and fixed a missing `await` in the Kafka pipeline.

## Upgrade Instructions
To apply the v0.29.1 update:
```bash
git pull origin dev
docker compose build frontend
docker compose up -d --build adsb-poller maritime-poller backend-api
```
