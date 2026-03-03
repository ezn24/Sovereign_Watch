# Release — v0.13.1 — Stability Hotfixes & Repeater Auth

**Released:** 2026-03-02

---

## Overview

v0.13.1 is a hotfix release addressing newly identified edge cases from the 0.13.0 stability audit, prioritizing application performance and upstream API security compliance.

---

## Key Fixes

### 🔴 P0 — Critical (Rendering / Upstream APIs)

| # | Area | Impact |
|---|------|--------|
| HOTFIX | Map Rendering | Resolved a critical infinite re-render loop in `useInfraData` that caused "Maximum update depth exceeded" crashes. |
| HOTFIX | Infrastructure | Restored the `/api/repeaters` Proxy by adding `REPEATERBOOK_API_TOKEN` authentication to comply with their new security policy. |
| HOTFIX | Infrastructure | Implemented a Demand-Driven Redis cache (24h TTL) for repeaters to minimize external API roundtrips and improve UX. |

### 🟠 P1 — High (Concurrency / Streaming)

| # | Area | Impact |
|---|------|--------|
| NEW-003 | Analysis API | Migrated the LLM streaming endpoint to `acompletion` and `async for` generators to prevent blocking the FastAPI event loop. |
| NEW-001 | JS8Call Bridge | Replaced deprecated `asyncio.get_event_loop()` with `get_running_loop()` in the lifespan context manager. |

### 🟡 P2/P3 — Medium & Code Quality

| # | Area | Impact |
|---|------|--------|
| NEW-004 | Tracks API | Added lower-bound validation (`limit <= 0`) to the `/api/tracks/replay` endpoint. |
| NEW-002 | JS8Call Bridge | Removed residual `TAK Stream disconnected` console logs from production. |
| NEW-005 | TAK Worker | Removed a stale, dead reference to `updateData.raw` in `useEntityWorker` resulting from earlier optimizations. |

---

## Files Changed

```
backend/api/routers/analysis.py
backend/api/routers/repeaters.py
backend/api/routers/tracks.py
frontend/src/hooks/useEntityWorker.ts
frontend/src/hooks/useInfraData.ts
js8call/server.py
```

---

## Upgrade Instructions

```bash
git pull origin main
# REPEATERBOOK_API_TOKEN must now be set in your .env or docker-compose.yml
docker compose up -d --build backend-api frontend
```