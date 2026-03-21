# Release - v0.43.1 - Extreme Latitude Hotfix

## High-Level Summary

This release resolves a critical visual distortion issue in the NOAA Auroral Oval layer where points near the poles would "balloon" into massive, screen-filling artifacts when viewed in 2D Web Mercator mode. This ensures the map remains usable and clean for all users, including those near polar regions.

## Fixed

- **Aurora Blob Distortion**: Implemented a ±85° latitude filter for the `ScatterplotLayer` in 2D mode, preventing Web Mercator's infinite scale at the poles from distorting meter-radius data points. Points remain fully visible in Globe mode where projection is accurate.

## Technical Details

- Updated `frontend/src/layers/buildAuroraLayer.ts` with latitude-based data filtering.
- Re-calculated `depthBias` and `z-ordering` impact (negligible).

## Upgrade Instructions

```bash
# 1. Pull down the latest release
git pull origin main

# 2. Rebuild the frontend
docker compose build frontend

# 3. Restart the stack
docker compose up -d
```
