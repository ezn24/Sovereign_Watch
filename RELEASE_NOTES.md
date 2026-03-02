# Release — v0.13.0 — Stability Hardening

**Released:** 2026-03-01

---

## Overview

v0.13.0 is a comprehensive **stability and code-quality release** driven by a full systematic audit of the Sovereign Watch codebase (`BUG_AUDIT_REPORT_2026-03-01.md`). All **20 identified bugs** across P0 (Fix Now), P1 (This Sprint), P2 (This Sprint), and P3 (Code Quality) priority tiers have been resolved.

No new features were added. This release is a pure hardening pass targeting data integrity, concurrency correctness, API security, and code-quality debt.

---

## Key Fixes

### 🔴 P0 — Critical (Data Loss / Rate Throttling)

| # | Area | Impact |
|---|------|--------|
| BUG-001 | Aviation Poller | Double rate-limiter halved ADS-B polling throughput |
| BUG-002 | Historian Service | In-flight data batch silently lost on SIGTERM shutdown |
| BUG-005 | Analysis API | Blocking LLM call stalled the entire FastAPI event loop |

### 🟠 P1 — High (Crashes / Data Integrity)

| # | Area | Impact |
|---|------|--------|
| BUG-003 | Signal handlers (Aviation + Maritime Pollers) | `RuntimeError` on SIGTERM in signal handler context |
| BUG-004 | Analysis API | `TypeError` crash when `AVG()` returns `NULL` (empty history window) |
| BUG-009 | Historian Service | Batch silently dropped when DB pool unavailable |
| BUG-012 | Historian Service | Batch cleared even after a failed DB write — data loss |

### 🟡 P2 — Medium (Security / Correctness)

| # | Area | Impact |
|---|------|--------|
| BUG-006 | Tracks API | Reversed time window accepted silently in replay endpoint |
| BUG-007 | Tracks API | Zero/negative `limit` and `hours` accepted without validation |
| BUG-008 | JS8Call Bridge | `allow_credentials=True` + `allow_origins=["*"]` rejected by all browsers (CORS spec violation) |
| BUG-010 | Orbital Pulse Utils | Division by zero at polar latitudes in ECEF→LLA conversion |
| BUG-011 | JS8Call Bridge | Deprecated `get_event_loop()` in Python 3.10+ coroutine context |

### ⚪ P3 — Code Quality

| # | Area | Change |
|---|------|--------|
| BUG-013 | Frontend (TacticalMap, useEntityWorker) | 5 debug `console.log` calls removed from production hot paths |
| BUG-014 | JS8Call WebSocket handler | Redundant always-True inner `if` guard removed |
| BUG-015 | useEntityWorker DR state | Duplicate `drStateRef.current.get()` call consolidated |
| BUG-016 | JS8Call Bridge | `_message_queue` type annotation corrected to `Optional[asyncio.Queue]` |
| BUG-017 | API Main | Deprecated `@app.on_event` migrated to `lifespan` context manager |
| BUG-018 | TAK Worker | Hex byte dump computation removed from decode hot path |
| BUG-019 | Maritime Poller | Magic number `511` replaced with `AIS_HEADING_NOT_AVAILABLE` constant |
| BUG-020 | Maritime Poller Utils | AISStream bounding box lat clamped to `[-90, 90]` |

---

## Files Changed

```
backend/api/main.py
backend/api/routers/analysis.py
backend/api/routers/tracks.py
backend/api/services/historian.py
backend/ingestion/aviation_poller/main.py
backend/ingestion/aviation_poller/service.py
backend/ingestion/maritime_poller/main.py
backend/ingestion/maritime_poller/service.py
backend/ingestion/maritime_poller/utils.py
backend/ingestion/orbital_pulse/utils.py
frontend/src/components/map/TacticalMap.tsx
frontend/src/hooks/useEntityWorker.ts
frontend/src/workers/tak.worker.ts
js8call/server.py
```

---

## Test Results

```
17 passed in 0.70s — zero regressions
```

---

## Upgrade Instructions

```bash
git pull origin main
docker compose up -d --build backend-api adsb-poller ais-poller orbital-pulse js8call
docker compose logs -f backend-api
```

No schema migrations. No new environment variables.