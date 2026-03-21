# 2026-03-21-hotfix-aurora-mercator-distortion

## Issue

Web Mercator distortion at extreme latitudes (near the poles) caused NOAA aurora data points to render as giant, screen-filling blobs in 2D mode. This occurred because the `ScatterplotLayer` uses meter-radius circles which, when projected onto a 2D Mercator map near the poles, balloon in size to cover the entire screen.

## Solution

Implemented a latitude filter in `buildAuroraLayer.ts` that clamps the rendered data to ±85° when the map is not in Globe (3D) mode. Filtered points remain visible in Globe mode where Mercator distortion is not an issue.

## Changes

- **frontend/src/layers/buildAuroraLayer.ts**: Added logic to `features.filter` to exclude points beyond ±85° latitude when `globeMode` is false.

## Verification

- **Visual Inspection**: Manually verified that the aurora oval no longer causes "screen takeover" artifacts near the South Pole when switching to 2D view.
- **Unit Tests**: Ran frontend linting to ensure no regressions.

## Benefits

- Prevents critical UI occlusion for users operating at high latitudes.
- Improves performance by reducing the number of massive geometries the GPU needs to rasterize in Mercator mode.
- Maintains visual fidelity in Globe mode where polar data is most valuable.
