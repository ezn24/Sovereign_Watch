# Release - v0.47.1 - Frontend Modularization

This release improves the internal architecture of the frontend intelligence pipeline by extracting key logic from monolithic components and hooks into dedicated, reusable modules. The primary value is higher maintainability and testability with behavior preserved for operators.

## High-Level Summary
The dashboard and entity-worker paths were refactored to separate concerns across alert engines, domain filters, widgets, and worker protocol handling. Inline logic that previously lived in `DashboardView`, `IntelFeed`, and `useEntityWorker` is now encapsulated in focused modules, reducing complexity and making future changes safer.

## Key Features
- **Alert Engines**: Introduced `AviationAlertEngine.ts` and `MaritimeAlertEngine.ts` to centralize emergency/distress detection and normalized alert message construction.
- **Domain Event Filters**: Added dedicated filtering modules for aviation, maritime, and orbital streams (`AviationEventFilter.ts`, `MaritimeEventFilter.ts`, `OrbitalEventFilter.ts`).
- **Widget Extraction**: Split dashboard widget responsibilities into reusable components: `MiniMap`, `StreamStatusMonitor`, `OutageAlertPanel`, `RFSiteSearchPanel`, and `TrackSparkline`.
- **Worker Protocol Isolation**: Added `WorkerProtocol.ts` to encapsulate worker initialization, WebSocket lifecycle management, and reconnect behavior.
- **Shared Utilities**: Added `trailSmoothing.ts` and `EventCategorizer.ts` for reusable smoothing/styling behavior across feed and map contexts.

## Technical Details
- **Behavior Preservation**: Refactor is intentionally non-breaking at runtime; extracted modules preserve existing UI and alert behavior.
- **Complexity Reduction**: `useEntityWorker.ts` and `DashboardView.tsx` now act as orchestration layers with less inline logic and tighter module boundaries.
- **Consistency Gains**: Unified event filtering and style categorization reduce drift risk across air, sea, and orbital event rendering paths.
- **No Protocol Changes**: No TAK protocol schema or backend API contract changes were introduced in this release.

## Upgrade Instructions
1. Pull the latest branch and update local refs.
2. In `frontend/`, install dependencies if needed: `pnpm install`.
3. Run frontend verification: `pnpm run lint && pnpm run test`.
4. Rebuild and restart the frontend service for runtime parity: `docker compose up -d --build sovereign-frontend`.
