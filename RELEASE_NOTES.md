# Release - v0.28.2 - Maritime Intelligence Restoration

This release resolves a critical regression in maritime vessel tracking and delivers a comprehensive cleanup of the frontend and backend codebases. Ships are now fully visible on the Tactical Map with significantly more accurate classification tags in the Intelligence Stream.

## 🚢 Maritime Intelligence Restoration

A series of compounding bugs introduced during code cleanup caused all AIS maritime vessels to disappear from the Tactical Map. This release surgically repairs the full AIS data pipeline:

- **Silent Kafka Drop (Critical Fix)**: The `publish_tak_event` coroutine was being called without `await`, causing every Kafka message to be silently discarded. No data was reaching the historian or the frontend.
- **Blocked Stream Loop**: The WebSocket receive loop was unable to react to mission area changes from Redis, locking the poller to the initial bounding box. The loop is now fully interruptible via an `asyncio.Event`.
- **Classification Key Mismatch**: The Intelligence Feed backend expected a `classification` key while the poller only emitted `vesselClassification`. Both keys are now populated for full pipeline compatibility.

## 🏷️ Expanded Vessel Classification

Name-based heuristics in the AIS classification engine have been substantially expanded, dramatically reducing `[UNKNOWN]` tags in the Intelligence Stream for common PNW and global fleets:

- **Washington State Ferries**: `WSF` prefix now maps to `passenger`.
- **Foss Maritime / Tugs**: `FOSS`, `PUSH`, `VALIANT` map to `tug`.
- **USCG / Military**: `CGC`, `RFA` added alongside existing `USS` / `USNS`.
- **Pleasure Craft**: `MY`, `M/Y`, `SY` patterns added.
- **Law Enforcement**: `POLICE`, `SHERIFF`, `PATROL` now recognized.

## 🧹 Code Cleanup

- Comprehensive dead code removal across the frontend (`useAnimationLoop`, `useEntityWorker`, `useMissionLocations`, `useRFSites`, `App.tsx`, and more).
- Backend: Removed unreachable code, fixed stale imports, and deleted one-off debug scripts from `infra_poller/test/`.
- JS8Call: Consolidated 5 duplicated UDP send blocks into a single `_udp_send()` helper; fixed `freq` int/float type mismatch.

## 📄 Upgrade Instructions

```bash
git pull origin main
docker compose up -d --build ais-poller
```

---
*Sovereign Watch - Distributed Intelligence Fusion*
