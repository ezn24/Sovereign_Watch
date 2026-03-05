# Release - v0.17.0 - Orbital Situational Awareness Expansion

## Summary

v0.17.0 advances the Orbital Dashboard with three meaningful operator improvements: a live **Observer AOI Horizon Ring** on the orbital map that shows exactly where pass predictions are calculated from, full **right-click Mission Control** on the orbital map (matching the tactical map's context menu), and a critical **COMMS constellation pass prediction safety guard** that prevents the SGP4 pass prediction server from being flooded when the Starlink/OneWeb/Iridium layer is enabled. This release also resolves a persistent visual bug where the TYPE_TAG and REGISTRATION badges in the right sidebar were being clipped behind the Position Telemetry section.

---

## Key Features

### 🛸 Observer AOI Horizon Ring (Orbital Map)
A soft purple geodesic ring now renders on the orbital map centered on your active mission location, with a radius matching your configured mission area. A small dot marks the precise observer position used for all SGP4 pass calculations. The ring updates automatically when you change your mission area — giving operators an immediate visual reference for which ground footprint pass predictions are computed from.

### 🖱️ Right-Click Mission Control (Orbital Map)
Right-clicking anywhere on the orbital map now opens the full Mission Control context menu, identical to the tactical map:
- **Set Mission Focus** — relocates the observer position and immediately updates the AOI ring
- **Save Location** — bookmark any clicked coordinate using the save-location form
- **Return Home** — snap back to the configured home mission area

### 🛡️ COMMS Layer Pass Prediction Guard
Enabling the COMMS satellite filter (Starlink, OneWeb, Iridium, amateur constellations — 8-10k satellites) previously sent a category-wide SGP4 pass prediction request to the backend, saturating the server and bricking egress. This is now gated at two levels:
- **Frontend**: pass prediction is skipped for the `comms` category; the Pass Predictor widget shows a clear operator-facing notice
- **Backend**: `/api/orbital/passes?category=comms` without explicit `norad_ids` returns `HTTP 400` immediately

Per-satellite on-demand prediction (clicking an individual sat) continues to work normally.

---

## Bug Fixes

- **Sidebar Header Clipping** — The TYPE_TAG and REGISTRATION badge row in `SidebarRight` was hidden behind other content due to `overflow-hidden` on the header div. Removed; all badges are now fully visible.
- **Phantom Actions Bar** — The TRACK_LOG button and its flex container are now hidden for satellite entities, preventing empty spacing from rendering in the orbital sidebar.

---

## Technical Details

- `buildAOTLayers.ts`: New optional `observer` param, imports `ScatterplotLayer`, and includes `geodesicCircle()` helper for 128-vertex ring generation
- `useAnimationLoop.ts`: New `observerRef` option threads the observer position into the layer build pipeline
- `OrbitalMap.tsx`: Maintains `observerRef` from `currentMissionRef`; imports `MapContextMenu` and `SaveLocationForm`; right-click state management mirrors `TacticalMap.tsx`
- `orbital.py`: Server-side `PASS_HEAVY_CATEGORIES` guard added before DB query

---

## Upgrade Instructions

```bash
git pull origin main
docker compose build frontend sovereign-backend
docker compose up -d
```

No database migrations required. No new environment variables.
