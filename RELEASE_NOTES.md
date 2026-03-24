# Release - v0.47.0 - Shadow Pulse Optimization

This update focuses on situational awareness and interface refinement. We have optimized the intelligence streams to provide a cleaner, more actionable data flow while unifying the visual identity of orbital surveillance assets.

## High-Level Summary
Operators will notice a significantly more stable intelligence feed during high-intensity operations, as we have introduced a rate-limiting throttle for general events while preserving the immediacy of tactical alerts. The dashboard and orbital widgets now share a consistent purple aesthetic for ISR satellite assets, and the Global Situation view provides a distraction-free overview by removing geographical labels.

## Key Features
- **Intelligent Event Throttling**: Added a 1-second per-category throttle for 'New' and 'Lost' entity events in the main HUD. Tactical and critical alerts bypass this throttle for zero-latency awareness.
- **ISR Asset Rebranding**: Standardized the 'PassPredictor' and 'Dashboard' orbital grids with a purple accent theme to distinguish Intelligence/ISR satellites from general space debris and constellations.
- **Situational Globe Overhaul**: Removed clutter by filtering out country and place-name labels from the primary SIT-GLOBE, improving clarity for infrastructure and orbital overlays.

## Technical Details
- **Frontend Performance**: Reduced CLI spam and DOM churn by implementing a `useRef`-based throttling pattern in the central event bus.
- **MapLayer Optimization**: Integrated style-layer filtering in the MapLibre adapter to dynamically prune basemap labels.
- **State Integrity**: Resolved cascading JSX errors that previously impacted the dashboard's pass-predictor grid during constellation transitions.

## Upgrade Instructions
1. Pull the latest `main` branch.
2. Run `pnpm install` in the `frontend/` directory to sync metadata.
3. Rebuild the frontend container: `docker compose up -d --build sovereign-frontend`.
