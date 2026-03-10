# Release - v0.22.1 - KiwiSDR Node Constraints

## High-Level Summary

This patch release resolves limitations within the KiwiSDR mapping feature, ensuring that operators can configure and view the complete global network of available receivers. It also adds and themes MapLibre zoom controls for improved tactical map navigation.

## Key Features

- **Global Node Sync**: Increased the internal API limit to 10,000, allowing the "Global" filter to correctly pull and render all cached KiwiSDR receivers on the globe.
- **Dynamic Radius Logic**: Hardcoded constraints applied to the preset map view toggles: 50 closest nodes for Mission Area, 500 nodes (2000 NM radius) for Regional Area, and no limits for Global.
- **Improved Map Navigation**: Added classic `NavigationControl` (Zoom In/Out + Compass) to the bottom-right corner of the node cluster map.
- **Styling Preservation**: Re-architected MapLibre CSS overrides so they bypass Tailwind's aggressive JIT purging, guaranteeing consistent dark tactical aesthetics across builds.

## Technical Details

- **Backend**: Overrode the `get_kiwi_nodes` API limit parameter in `js8call/server.py`.
- **Frontend**: Force-refetch logic bound to the `limit` query param within the `useKiwiNodes` React hook.

## Upgrade Instructions

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker compose up -d --build
```
