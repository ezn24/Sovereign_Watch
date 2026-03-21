# Release - v0.42.2 - Tactical Mapping & Filtering Refinements

## Summary

This hotfix reinforces the tactical reliability of the RF and Infrastructure layers. We have removed data-obscuring clustering for radio sites and synchronized the filtering behavior across the Global Network category (Towers, Cables, Outages). These changes ensure that the "master toggle" consistently controls all related infrastructure and that RF nodes correctly vanish when all service-specific sub-filters are disabled.

This release also includes a massive "Repo Hygiene" pass, pruning over 17,000 lines of obsolete task logs to optimize repository performance.

## Key Features

*   **RF High-Granularity Mapping**: Removed clustering for RF Nodes. All repeater sites are now rendered as individual points across all zoom levels for maximum tactical accuracy.
*   **Unified Global Network Toggle**: Synchronized "FCC TOWERS" with the master category toggle. Turning "GLOBAL NETWORK" on or off now affects towers, cables, and outages simultaneously.
*   **Intelligent RF Filtering**: Fixed a bug where disabling all individual service categories (Ham, NOAA, Safety) would leak all sites to the map; nodes now correctly clear when no services are selected.
*   **Roadmap Modernization**: Integrated strategic research for GDELT, SIGINT Jamming detection, and Space Weather into the formal project backlog.

## Technical Details

*   **Frontend**: Updated `buildRFLayers.ts`, `useRFSites.ts`, and `SystemStatus.tsx` to handle synchronized filtering and individual node rendering.
*   **Hygiene**: Deleted `agent_docs/tasks/archive/` comprising ~17.5k lines of historical logs to restore token efficiency and reduce workspace load times.
*   **Formatting**: Standardized `ScatterplotLayer` configuration and syntax in `buildTowerLayer.ts`.

## Upgrade Instructions

Standard hot-reload deployment. Ensure you pull the latest `frontend/package.json` to track the patch version.

```bash
git pull origin main
docker compose build frontend
docker compose up -d
```
