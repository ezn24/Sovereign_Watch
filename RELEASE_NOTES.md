# Release - v0.18.0 - Glass & Signals

## High-Level Summary

This release marks a significant convergence of aesthetic refinement and architectural stability. The "Sovereign Glass" design system has been fully restored and polished, while the signal intelligence (SIGINT) backend has been re-engineered for industrial-grade reliability. Operators will experience a more responsive, visually cohesive tactical environment with enhanced reach via the new KiwiSDR integration.

## Key Features

- **Sovereign Glass UI Restoration**: Reverted to individual glass containers with refined 12px shadows for improved tactical depth.
- **Enhanced Signal Intelligence**: Replaced legacy bridge with a native AsyncIO UDP bridge for JS8Call, eliminating startup crashes on Windows.
- **KiwiSDR Public Directory Integration**: Automatic proximity-based discovery of global SDR nodes using Haversine distance.
- **Tactical Legend Evolution**: Redesigned Altitude and Maritime legends matching the Mission Navigator's visual language.
- **Nginx Unified Entry Point**: All services now route through an optimized reverse proxy on port 80.

## Technical Details

- **Backend**: Migrated JS8Call bridge to `asyncio.DatagramProtocol`.
- **Frontend**: Restructured sidebar widgets for HMR stability and performance.
- **Infrastructure**: Consolidated container ports; all internal traffic now uses Docker overlay networks exclusively.

## Upgrade Instructions

```bash
docker compose down
docker compose up -d --build
```
