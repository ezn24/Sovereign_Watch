# Release - v0.28.3 - Filter Integrity & Stream Stability

This release fixes two frontend bugs: category filters being silently ignored during track replay, and the WIDE-mode waterfall stream failing on load.

---

## 🗂 Replay Category Filters Now Work for Ships and Aircraft

### What was broken

When using the track replay timeline, all vessel and aircraft category filters (cargo, tanker, passenger, fishing, military, commercial, helicopter, drone, etc.) had no effect — every entity rendered on the map regardless of which filters were active. Live mode was unaffected.

### Root cause

`processReplayData` (`replayUtils.ts`) reconstructs `CoTEntity` objects from historical database rows. It correctly mapped `meta.callsign` but never mapped `meta.classification`, which is where both the AIS poller and the ADS-B poller store their classification data.

The animation loop's `filterEntity()` function reads category from two distinct top-level fields on the entity:
- Ships → `entity.vesselClassification.category`
- Aircraft → `entity.classification.affiliation` / `entity.classification.platform`

Since neither field was ever populated in replay mode, `filterEntity()` skipped all category checks for every entity and let everything through.

### Fix

`processReplayData` now maps `meta.classification` from the DB row into the correct top-level field based on entity type:

| Entity type | Source | Destination |
|---|---|---|
| Ship (CoT type contains `S`) | `meta.classification.category` | `entity.vesselClassification.category` |
| Aircraft | full `meta.classification` | `entity.classification` |

Three new tests cover ship category mapping, aircraft classification mapping, and graceful handling of rows with no classification data.

---

## 📡 Waterfall Stream Restored

The WIDE-mode waterfall WebSocket connection was failing immediately on every page load, cycling in a rapid connect → disconnect → reconnect loop with no data ever reaching the canvas. The browser console displayed:

> `WebSocket ws://localhost/js8/ws/waterfall failed: WebSocket is closed before the connection is established.`

Two compounding issues were identified and resolved:

### 1. Over-specified `useEffect` Dependencies

In `ListeningPost.tsx`, the WebSocket lifecycle effect had `wfOffset` and `zoom` in its dependency array. Because `drawRow` closed directly over `wfOffset`, any slider interaction caused `drawRow` to be recreated — which triggered the effect to tear down the WebSocket and immediately reopen it, repeatedly, before any handshake could complete.

**Fix**: `drawRow` now reads `wfOffset` via a `wfOffsetRef` (kept in sync with a dedicated `useEffect`) and carries a stable `[]` dep array. The WebSocket effect deps are reduced to `[wfMode, analyserNode]` — the only two values that genuinely require a new connection.

### 2. React StrictMode Close-Before-Open Race

In development, React 18 `StrictMode` intentionally double-invokes effects: it mounts, runs cleanup, then remounts. The cleanup called `ws.close()` while the socket was still in `CONNECTING` state — the precise trigger for the browser error above.

**Fix**: The effect cleanup now checks `ws.readyState`. If `CONNECTING`, it registers `ws.onopen = () => ws.close()` instead of calling `close()` immediately, allowing the handshake to complete before tearing down cleanly.

---

## 📄 Upgrade Instructions

No backend or database changes — frontend-only. For a clean pull:

```bash
git pull origin main
docker compose up -d --build frontend
```

---
*Sovereign Watch - Distributed Intelligence Fusion*
