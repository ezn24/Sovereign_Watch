# 2026-03-21 - Space Weather & RF Refinement

## Issue
1. `sovereign-space-weather-pulse` was failing because the aurora forecast URL (`aurora-1-hour-forecast.json`) no longer exists on NOAA SWPC.
2. Space weather data was and also failing to persist because the `space_weather_kp` table was missing from the database.
3. RF node clustering was deemed redundant and less effective than the current bounding-box constrained rendering.
4. If all RF service filters were disabled, the map would incorrectly fetch all RF nodes.
5. Global network filter was not toggling FCC towers correctly.

## Solution
1. Updated `AURORA_URL` in `space_weather_pulse/main.py` to `ovation_aurora_latest.json` and fixed parsing logic.
2. Created `space_weather_kp` and `jamming_events` tables in TimescaleDB.
3. Removed all clustering logic from `buildRFLayers.ts` and set it to render only individuals.
4. Added strict guards in `useRFSites.ts` to clear nodes if no services are selected.
5. Added `showTowers` to `MapFilters` and synced its toggle with the Global Network icon in `SystemStatus.tsx`.
6. Updated `useTowers.ts` to skip fetching if the layer is not active.

## Changes
- `backend/ingestion/space_weather_pulse/main.py`: URL and parsing logic update.
- `backend/db/init.sql`: Added space weather tables.
- `frontend/src/layers/buildRFLayers.ts`: Removed clustering.
- `frontend/src/hooks/useRFSites.ts`: Added service clearing guard.
- `frontend/src/hooks/useTowers.ts`: Added `enabled` flag.
- `frontend/src/components/widgets/SystemStatus.tsx`: Synced Global Network toggle with FCC towers.
- `frontend/src/App.tsx`: Filter state management and hook update.

## Verification
- Space weather logs confirmed successful Kp and Aurora persistence.
- RF nodes rendering as individuals only.
- Filters correctly clearing nodes when all services are deselected.
- Global network toggle correctly switches both cables and towers.

## Benefits
- Accurate space weather situational awareness (aurora and Kp).
- More responsive and consistent RF node rendering.
- Reduced API overhead for the FCC towers layer.
- Better UX in the infrastructure control panel.
