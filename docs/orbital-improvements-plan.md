# Orbital Map — Improvements Plan
Sovereign Watch v0.14 · 2026-03-04

## Architecture Context (Do Not Duplicate)

Before building anything, record what already exists so we don't add redundant controls.

| Feature | How it's handled | Where |
|---------|-----------------|-------|
| Globe / 2D / 3D projection toggle | Built into OrbitalMap HUD (bottom-center buttons) | `OrbitalMap.tsx` |
| Terminator (day/night line) | Global TopBar toggle (Moon icon) → `showTerminator` in `orbitalFilters` | `TopBar.tsx` + `App.tsx` |
| History trails / ground track visibility | Global TopBar toggle (History icon) → `showHistoryTails` passed to OrbitalMap | `TopBar.tsx` + `App.tsx` |
| Right inspector panel | `SidebarRight` is already rendered in orbital mode at the `App.tsx` level, same as tactical — **no separate `OrbitalDashboard` right panel is needed** | `App.tsx` lines 497-506 |
| `OrbitalDashboard.tsx` | **Unused** — App.tsx renders `OrbitalMap` + `OrbitalSidebarLeft` directly. Do not route through `OrbitalDashboard` | `OrbitalDashboard.tsx` |

---

## What to Build

### Group 1 — SidebarRight: Satellite Inspector Enhancements
*Enhances the existing `isSat` branch in `SidebarRight.tsx`. No new panel needed.*

**1a. Add missing orbital parameters**
SidebarRight currently shows: category, NORAD ID, intl_des, altitude, period_min.
Add: inclination_deg and eccentricity — both are already present in `entity.detail` from the WebSocket feed.

**1b. Current az/el live readout**
Compute observer → satellite azimuth and elevation client-side using the satellite's live lat/lon/alt from the entity and the home location from `getMissionArea()` (with env-var fallback). Update every time the entity position updates (no polling needed — hook into whatever drives re-render on entity changes). The math is the same ECEF rotation used in the backend router.

**1c. Next pass AOS/TCA/LOS countdown**
When a satellite is selected in SidebarRight, call `usePassPredictions` filtered to that `norad_id`. Display the soonest upcoming pass as a live countdown: `AOS T-12:34`, `TCA T+00:45`, `LOS T+08:12`. Use a `useEffect` interval ticking every second against the AOS/TCA/LOS ISO strings.

---

### Group 2 — PassPredictorWidget UX
*Small polish items in `PassPredictorWidget.tsx` and `OrbitalSidebarLeft.tsx`.*

**2a. Live countdown column**
Replace the static AOS time string in each pass list row with a live `T-HH:MM:SS` countdown. `useEffect` with a 1-second interval recalculating from `pass.aos`.

**2b. Min elevation filter dropdown**
Add a `MIN EL: [10° ▾]` pill/dropdown next to the pass list header. Options: 0°, 5°, 10°, 15°, 20°, 30°. This controls the `minElevation` option passed to `usePassPredictions` (the hook already accepts it).

**2c. CSV export button**
Add a small download icon button in the pass list header. On click: serialize `passes[]` to CSV (norad_id, name, aos, tca, los, max_elevation, duration_seconds) and trigger `window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))`.

---

### Group 3 — OrbitalSidebarLeft: Search & Counts
*Targets `OrbitalSidebarLeft.tsx` and `OrbitalCategoryPills.tsx`.*

**3a. Satellite count per category pill**
Count entities in the current WebSocket entity map by category. Render each pill as `GPS (127)` instead of just `GPS`. `OrbitalSidebarLeft` already has access to the entity list via `filters`/props — confirm the entity map is accessible, otherwise pass a `entityCount` map in from App.tsx.

**3b. NORAD ID / name search**
Add a compact search input above the category pills. Filter the entity map shown on the map by callsign or NORAD ID substring match. This does not require a new API call — it filters `entities` already in the WebSocket feed. Wire via a new `searchTerm` filter prop or by calling `onFilterChange('satelliteSearch', term)`.

---

### Group 4 — Ground Track PathLayer in OrbitalMap
*The backend endpoint `GET /api/orbital/groundtrack/{norad_id}` already exists and returns a GeoJSON LineString. The frontend does not yet render it.*

When a satellite is selected (`selectedEntity` is an `isSat` entity and `showHistoryTails` is true), fetch the ground track from `/api/orbital/groundtrack/{norad_id}?minutes_ahead=90&minutes_behind=90` and render it as a Deck.gl `PathLayer` in `OrbitalMap.tsx`. The layer should:
- Fade opacity with time distance from current position
- Respect the existing `showHistoryTails` global toggle (if tails are off, skip the fetch)
- Use the same purple satellite accent color

---

### Group 5 — Footprint Circles by Altitude
*In `OrbitalMap.tsx`, satellite footprints currently use a hardcoded radius.*

Replace the hardcoded radius with:
```
footprint_radius_km = R_earth * arccos(R_earth / (R_earth + altitude_km))
```
where `altitude_km` comes from `entity.altitude / 1000`. `R_earth = 6371`. No API call needed.

---

### Group 6 — Backend: Batch Pass Endpoint
*Unblocks "upcoming passes" list without requiring a satellite to be pre-selected.*

Add `GET /api/orbital/passes/all?lat=Y&lon=Z&hours=6&limit=20` to `orbital.py`. Queries the `satellites` table for all satellites, runs pass prediction for each, sorts by AOS, returns the soonest `limit` passes. This is what powers the "next N passes across all visible satellites" view in PassPredictorWidget when no satellite is selected.

Pair with a simple Redis cache (key: `passes_all:{lat}:{lon}:{hours}`, TTL: 5 minutes) to avoid re-running the full propagation sweep on every request.

---

## Implementation Sequence

```
Priority   Group  Task
─────────────────────────────────────────────────────────────────────
1 (quick)  2a     Pass countdown timer in PassPredictorWidget
2 (quick)  2b     Min elevation filter dropdown
3 (quick)  2c     CSV export button
4          1a     SidebarRight: inclination + eccentricity fields
5          1b     SidebarRight: live az/el readout
6          1c     SidebarRight: next pass AOS/TCA/LOS countdown
7          3a     Category pill satellite counts
8          3b     NORAD ID / name search input
9          4      Ground track PathLayer in OrbitalMap (uses existing API)
10         5      Footprint circles by altitude (no API, pure math)
11         6      Batch pass endpoint + Redis cache
```

Groups 1–3 and 5 are pure frontend, no backend changes. Group 4 requires a small fetch in OrbitalMap but uses an existing endpoint. Group 6 is the only item requiring new backend code.

---

## Out of Scope for This Plan

These items from the original analysis doc are deferred — either already handled by global controls or lower priority:

- Globe / 2D / 3D sidebar toggle — **already in OrbitalMap HUD**
- Terminator toggle — **already in TopBar**
- Ground track visibility — **already controlled by TopBar history trail toggle**
- Space-Track.org authentication — deferred, Celestrak sufficient for now
- SatNOGS cross-reference — deferred, separate research effort
