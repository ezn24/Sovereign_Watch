# Sovereign Watch — Roadmap Gap Analysis

**Date:** 2026-03-06
**Version Analyzed:** v0.18.2
**Analyst:** Claude Code (automated review)
**Branch:** `claude/roadmap-gap-analysis-xakzj`

---

## Executive Summary

Sovereign Watch has progressed significantly beyond what the current ROADMAP.md reflects. The roadmap was last updated on 2026-03-02, but the codebase has advanced through two full releases (v0.18.0 Glass & Signals, v0.18.1 Sovereign Glass Update, v0.18.2 Globe Rendering Fix) and several untracked feature implementations in the orbital and radio domains.

This analysis cross-references:
- `ROADMAP.md` (last updated 2026-03-02)
- `docs/tasks/` — active task files
- `frontend/src/` — actual component/layer/widget implementations
- `backend/api/` and `backend/ingestion/` — backend services
- Recent git history (v0.13.0 → v0.18.2)

---

## 1. Completed Work Not Yet Reflected in ROADMAP.md

The following features were implemented after the last roadmap update and are missing from the "Completed" table:

| ID | Feature | Evidence |
|:---|:--------|:--------|
| **FE-28** | Satellite Dashboard Shell | `OrbitalDashboard` view mode in `App.tsx`, `OrbitalSidebarLeft.tsx`, `OrbitalCategoryPills.tsx` all exist |
| **FE-29** | Terminator Layer (Day/Night) | `TerminatorLayer.tsx` exists in `frontend/src/layers/` |
| **FE-30** | Satellite Telemetry Inspector | `SatelliteInspector` component, `DopplerWidget.tsx`, `PolarPlotWidget.tsx`, `PassPredictorWidget.tsx` all exist |
| **FE-31** | Orbital Category Pills | `OrbitalCategoryPills.tsx` implemented, GPS/COMMS/WEATHER/etc. filter pills |
| **Ingest-03a** | Celestrak Expanded Groups | 20 distinct ingestion categories added to `orbital_pulse/service.py` (was 5); TLE lines in payload |
| **Infra-03** | KiwiSDR Radio Integration | Merged PR #74 — `JS8Widget.tsx`, KiwiSDR TCP bridge, bearing layer |
| **Security-01** | DoS Prevention / Input Limits | Merged PR #73 — input length limits added |

---

## 2. Partially Implemented Features (Critical Gaps)

These features are visually present in the UI but have broken or missing backend wiring:

### GAP-01: Orbital Pass Prediction API (CRITICAL)

**Symptoms:** `PassPredictorWidget`, `DopplerWidget`, and `PolarPlotWidget` all render empty or static data.

**Root cause (documented in `docs/tasks/2026-03-04-orbital-pass-prediction-overhaul.md`):**
- The `satellites` table does **not exist** in `backend/db/init.sql`
- The Historian does **not upsert** TLE data from `orbital_raw` Kafka messages
- `GET /api/orbital/passes` endpoint is **not implemented** (route file `backend/api/routers/orbital.py` missing)
- `usePassPredictions` hook is **not connected** to a real API — `PassPredictorWidget` renders empty pass list

**Impact:** The entire Orbital Dashboard satellite-tracking intelligence layer is non-functional for pass prediction, Doppler, and polar plot features.

**Required work (6-phase plan documented in task file):**
1. Add `satellites` table to `backend/db/init.sql`
2. Add TLE upsert to `backend/api/services/historian.py`
3. Create `backend/api/routers/orbital.py` with `/api/orbital/passes` + `/api/orbital/groundtrack/{norad_id}`
4. Create `backend/api/utils/sgp4_utils.py` with TEME/ECEF/topocentric helpers
5. Create `frontend/src/hooks/usePassPredictions.ts` polling hook
6. Wire hook into `OrbitalSidebarLeft.tsx` → `PassPredictorWidget`, `DopplerWidget`, `PolarPlotWidget`

---

### GAP-02: Repeater Sub-Filter UI (FE-27)

**Symptoms:** `LayerFilters.tsx` has a REPEATERS toggle but **no mode sub-filters** (FM / P25 / DMR / D-Star / Fusion / Open).

**Status:** Data already present in RepeaterBook API response (`mode` field), backend proxy at `/api/repeaters/` fully operational. This is a pure frontend addition.

---

### GAP-03: CoT Tracking Restoration (Fix-01)

**Symptoms:** Cursor-on-Target protocol event tracking has not been verified after the v0.13.0 code audit refactors.

**Impact:** If CoT event flow is broken, any ATAK/WinTAK client integrations would silently fail. Needs end-to-end validation.

---

## 3. P0/P1 Features Not Yet Started

These are in the ROADMAP.md "Next Priority" queue and remain unimplemented:

| ID | Feature | Why It Matters |
|:---|:--------|:--------------|
| **FE-22** | Drone Tactical Layer | Drones currently render with the same generic aviation chevrons. `DroneLayer.tsx` does **not exist** in `frontend/src/layers/`. No rotor icon, no drone_class coloring. The classifier is complete (Ingest-07a done), making this a frontend gap only. |
| **FE-25a** | NOAA Weather Radio Layer | Static NOAA transmitter visualization, amber coverage circles. No `useNoaaRadio` hook exists. Simple static JSON asset + layer — very low complexity. |
| **FE-25c** | PSAP / 911 Centers Layer | Bundled GeoJSON of dispatch centers with red/amber markers. No PSAP data or layer exists. Low complexity. |

---

## 4. P2 Backlog — Not Started

Full RF infrastructure expansion and UX features. None of these have any code:

### 4.1 RF Infrastructure (Phase 3)

| ID | Feature | Complexity | Blocker |
|:---|:--------|:----------|:--------|
| **Ingest-09** | P25 System Pulse | Medium | RadioReference API key required |
| **FE-23** | P25 System Layer | Low | Needs Ingest-09 |
| **Ingest-10** | APRS Stream Poller | Medium | APRS-IS TCP bridge + classification logic |
| **FE-24** | APRS Layer | Low | Needs Ingest-10 |
| **Ingest-12** | DMR Brandmeister Pulse | Medium | Brandmeister API, 1h cache |
| **FE-26** | DMR Activity Layer | Low | Needs Ingest-12 |
| **Ingest-11** | FCC ASR Tower Service | Medium | FCC public DB download + bounding-box filter |
| **FE-25b** | FCC Tower Layer | Low | Needs Ingest-11 |
| **Ingest-08** | Infra Caching (Backend) | Low | Move cables/stations from localStorage to backend |

### 4.2 UX Improvements

| ID | Feature | Complexity | Notes |
|:---|:--------|:----------|:------|
| **FE-09** | Coverage Viz | Low | H3 polling fidelity hexagons |
| **FE-12** | Settings UI | High | Full UI for API key/poller config |
| **FE-13** | Mission Labels | Low | Floating text labels for AOT areas |
| **FE-14** | Deep Linking | Medium | Encode mission state in URL |
| **FE-15** | Data Portability | Medium | Import/Export mission presets JSON |
| **Backend-04** | Auth / RBAC | High | No user management or access control exists |
| **Ingest-07** | Drone Remote ID | High | RTL-SDR hardware dependency, SDR pipeline |

---

## 5. Phase 3+ Future Work

| ID | Feature | Phase |
|:---|:--------|:------|
| **Backend-05** | Multi-Area concurrent surveillance | Phase 6 |
| **FE-16** | Analytics Dashboard / Heatmaps | Phase 6 |
| **FE-17** | Collaborative Multi-User Sync | Phase 6 |
| **Ingest-04** | SIGINT/Jamming (NIC/NACp H3) | Phase 6 |
| **Ingest-05** | Spectrum (SatNOGS) | Phase 6 |
| **FE-18** | WebGPU Physics Worker | Phase 6 |
| **AI-01** | Advanced AI Analyst (LiteLLM deep reasoning) | Phase 8 |

---

## 6. Recommended Next Steps (Prioritized)

### Immediate (Sprint 1)

1. **GAP-01 — Orbital Pass Prediction API** *(highest impact)*
   - The satellite dashboard UI is complete but entirely non-functional for pass prediction.
   - Implement the 6-phase plan in `docs/tasks/2026-03-04-orbital-pass-prediction-overhaul.md`.
   - Estimated: 4–6 backend files, 3 frontend files, no new dependencies.

2. **FE-22 — Drone Tactical Layer**
   - Classification is already done. This is a pure frontend gap.
   - Create `DroneLayer.tsx` with rotor icon, drone_class color coding, and sub-filters in `LayerFilters.tsx`.

3. **FE-27 — Repeater Mode Sub-Filters**
   - Data already exists in the API. Frontend-only change to `LayerFilters.tsx`.
   - Lowest complexity of any open P1 item.

### Near-Term (Sprint 2)

4. **Fix-01 — CoT Tracking Validation**
   - Run end-to-end validation with a CoT client to confirm event tracking still works after v0.13.0 refactors.

5. **FE-25a — NOAA Weather Radio Layer**
   - Static data source, minimal backend work.

6. **FE-25c — PSAP / 911 Centers Layer**
   - Bundled GeoJSON, no backend required.

### Medium-Term (Sprint 3+)

7. **Ingest-08 — Infrastructure Caching** — Move submarine cable/stations to backend service.
8. **Ingest-09 + FE-23 — P25 Systems** — Begin RF infrastructure expansion.
9. **FE-14 — Deep Linking** — High operator value for mission sharing.
10. **FE-15 — Data Portability** — Mission preset export/import.

---

## 7. Health Assessment

| Domain | Status | Notes |
|:-------|:-------|:------|
| **Aviation (ADS-B)** | ✅ Fully Operational | Multi-source, arbitration, drone classification |
| **Maritime (AIS)** | ✅ Fully Operational | WebSocket, 11 vessel categories, DAM |
| **Orbital (Satellites)** | ⚠️ Partially Operational | Live tracking works; pass prediction UI non-functional |
| **Submarine Cables** | ✅ Fully Operational | GeoJson + landing stations |
| **RF Repeaters** | ⚠️ Missing Sub-Filters | Data available, UI filter missing |
| **JS8Call / KiwiSDR** | ✅ Fully Operational | Merged v0.18.x |
| **Replay / Historian** | ✅ Fully Operational | 24h retention, time-slider |
| **Drone Layer** | ❌ Not Implemented | Classifier done, no dedicated layer |
| **P25 / APRS / DMR** | ❌ Not Implemented | Phase 3 |
| **NOAA / PSAP / FCC Towers** | ❌ Not Implemented | Phase 3 |
| **Auth / RBAC** | ❌ Not Implemented | Phase 4+ |
| **AI Analyst** | ❌ Stub Only | LiteLLM configured, no analysis endpoints |

---

_Generated by automated codebase gap analysis. See ROADMAP.md for full feature specs._
