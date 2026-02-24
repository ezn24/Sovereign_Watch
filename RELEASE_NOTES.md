# Release - v0.9.3 - Globe Rendering Stability

## High-Level Summary

Version 0.9.3 resolves the critical rendering decoupling and visual artifacts experienced in Globe View. By systematically decoupling DeckGL's rendering context from Mapbox's WebGL engine while explicitly enforcing spherical projection math, the tactical HUD now perfectly rotates, pitches, and tracks with the 3D globe without risk of engine crashes.

## Key Features

### 🌍 Spherically Synchronized Tactical HUD

- **Rotation Sync**: The 2D Tactical Overlay now correctly queries Mapbox for real-time pitch and bearing when in Globe mode, ensuring footprints, labels, and trails remain perfectly stuck to the earth during complex camera maneuvers.
- **Double-Wrap Crash Fix**: Reverted a bug where DeckGL was attempting to apply spherical math _twice_ when interleaved mode was active, which previously threw all render coordinates into deep space.

## Technical Details

- **Interleaved Mode Disabled**: Force-disabled `interleaved` in `MapboxAdapter.tsx` to regain pure rendering stability.
- **Explicit Projection Injection**: When `globeMode` is active, the `MapboxOverlay` is now initialized with a hardcoded `projection: { name: 'globe' }` property, forcing the Canvas to warp without sharing the underlying GL context.

## Upgrade Instructions

```bash
# Pull latest changes and rebuild UI
docker compose pull
docker compose up -d --build frontend
```
