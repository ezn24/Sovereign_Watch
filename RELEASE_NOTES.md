# Release - v0.28.6 - RF Layer Rendering Patch

## High-Level Summary
This emergency patch resolves a frontend regression where RF repeater sites were hidden from the Tactical Map. It also fortifies the developer documentation to prevent similar regressions in future layer modifications.

## Key Features & Fixes
- **RF Layer Rendering**: Fixed a critical bug where `rfSitesRef` was disconnected from the map animation loop, causing repeater sites to be hidden despite successful data fetching.
- **Agent Documentation**: Significantly expanded `agent_docs/z-ordering.md` with a mandatory **Animation Loop Data Threading Checklist** to prevent silent failures in future map layer development.
- **Architectural Guardrails**: Updated `AGENTS.md` to require reading the z-ordering and threading guides before any map layer modifications.

## Technical Details
- **Frontend**: Restored the missing `rfSitesRef` binding in `TacticalMap.tsx` and updated the `useAnimationLoop` interface.

## Upgrade Instructions
This release updates both the backend logic (Historian) and the frontend rendering. A full rebuild is recommended.

```bash
git pull origin main
docker compose down
docker compose up -d --build
```
The system will automatically hydrate the database from the Kafka event bus within 30-60 seconds of startup.
