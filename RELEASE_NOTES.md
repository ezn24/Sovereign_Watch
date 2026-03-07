# Release - v0.20.0 - Operator Intelligence Suite

## Overview

v0.20.0 delivers a set of high-value operator-facing improvements across the AI analysis layer, the tactical alerts engine, and the live data pipeline. This release closes several longstanding display bugs in the orbital inspector, expands threat-detection alerts to cover military aircraft and drone/UAS contacts, introduces a switchable AI engine selector directly from the HUD, and eliminates an AIS data stream stability issue caused by rapid mission area changes.

---

## Key Features

### 🤖 AI Engine Widget — Live Model Selection
Operators can now switch between AI backends (GPT-4o, Gemini Flash, Claude Sonnet, local Ollama models, etc.) directly from the top bar at runtime. No container restarts required — the AI Analyst immediately uses the selected model for its next analysis request.

### ✈️ ADSB Military & Drone Alerts — Complete Alert Parity
The tactical alert engine now covers all three tracked domains:
- **Aviation** — One-time alerts when a military aircraft or drone/UAS first appears in the AOR.
- **Maritime** — Existing alerts for military vessels and AIS distress signals.
- **Orbital** — Existing alerts for imminent intel-satellite passes.

Each alert fires once per entity per session, preventing alert fatigue from repeated contacts.

### 🛰️ Orbital Inspector — Period & Inclination Fixed
The right sidebar now correctly displays PERIOD, INCLINATION, and ECCENTRICITY for orbital targets. These fields were silently showing "---" due to a camelCase/snake_case mismatch between the compiled protobuf field names (`periodMin`, `inclinationDeg`) and the property names being read in code (`period_min`, `inclination_deg`). The protobuf schema was also extended to carry these fields end-to-end.

### 🚢 AIS Stream Stability — Debounced Reconnects
The maritime AIS poller no longer floods AISStream.io with rapid reconnection attempts when the operator adjusts the mission radius. Two guards were added:
- **Minimum-change threshold** — Ignores mission updates where both lat/lon drift is < 0.05° and radius change is < 1 nm (eliminates floating-point noise and same-value re-selections).
- **5-second debounce** — Multiple rapid preset clicks (e.g., 30nm → 100nm → 150nm) now collapse into a single reconnect that fires 5 seconds after the last change, keeping the AISStream connection stable.

---

## Technical Details

| Component | Change |
|---|---|
| `frontend/src/components/widgets/AIEngineWidget.tsx` | New widget — runtime AI model selector |
| `frontend/src/components/layouts/TopBar.tsx` | Integrated `AIEngineWidget` into top bar |
| `frontend/src/hooks/useEntityWorker.ts` | ADSB military/drone one-time alert logic; `periodMin`/`inclinationDeg` fix |
| `frontend/src/components/layouts/SidebarRight.tsx` | `periodMin`/`inclinationDeg` fix; compact orbital info line; NORAD ID in registration badge |
| `backend/api/proto/tak.proto` | Added `period_min`, `inclination_deg`, `eccentricity` fields |
| `frontend/public/tak.proto` | Synced with backend proto |
| `backend/api/proto/tak_pb2.py` | Regenerated compiled proto |
| `backend/api/services/tak.py` | Populates new orbital fields in serialization |
| `backend/ingestion/maritime_poller/service.py` | 5s debounce + 0.05°/1nm min-change threshold for AIS reconnects |

---

## Upgrade Instructions

```bash
# Pull latest changes
git pull origin main

# Rebuild affected containers
docker compose build ais-poller frontend

# Restart all services
docker compose up -d
```

> No database schema changes in this release. No environment variables added or required.
