# Release - v0.12.0 - Infrastructure Awareness

**Released:** 2026-03-01

---

## Summary

v0.12.0 delivers Sovereign Watch's **Global Infrastructure Awareness** capability — a significant step forward in multi-INT fusion. Operators can now visualize the world's undersea communications backbone (submarine cables and landing stations) alongside the established RF repeater network, all rendered in a premium, unified "Sovereign Glass" aesthetic.

This release unifies all infrastructure layers under a clear and consistent **Emerald (RF) / Cyan (Undersea)** color protocol, ensuring operators can instantly identify the nature of an infrastructure asset at a glance. Combined with a refined clustering engine, actionable Intelligence Feed notifications, and a corrected Architecture documentation, v0.12.0 raises the bar for tactical situational awareness.

---

## ✨ Key Features

### 🌊 Undersea Infrastructure Awareness (NEW)
- **Live Submarine Cable Map:** Full global cable network rendered as Deck.gl line layers, with unique colors per cable system sourced directly from SubmarineCableMap.com.
- **Landing Station Indicators:** An independently toggleable layer for cable landing points, displayed as colored dots aligned to their cable's signature color.
- **Tactical Tooltips:** Hover over any cable or station to see a tactical intel card with cable name, owner(s), length, and operational status.
- **Intel Feed Events:** Toggling Submarine Cables or Landing Stations triggers a structured Intelligence Feed notification with timestamp and confirmation.
- **24h Cache:** Cable data is cached in `localStorage` for 24 hours, preventing redundant API calls on every session start.

### 📻 RF Infrastructure — Tactical Clustering Refinement
- **Emerald Cluster Sync:** Cluster halos updated from off-theme Violet to Emerald-400, bringing clusters into alignment with the entire RF color system.
- **Reduced Visual Weight:** Cluster bubble radii and glow intensities reduced significantly, eliminating the "bubble soup" effect in high-density repeater regions (e.g., Cascadia / Pacific Northwest).
- **Smarter Grid Logic:** Tightened the clustering grid multiplier and raised the zoom breakpoint from 6.0 to 7.5, giving operators a richer overview at mid-zoom without premature expansion.
- **Correct Intel Notifications:** Toggle events for RF repeaters now reliably broadcast the correct station count after the loading cycle completes.

### 🎨 Unified Infrastructure Color System
- **Emerald-400 (#34D399):** RF Infrastructure — Repeaters, JS8Call, status indicators.
- **Cyan-400 (#22D3EE):** Undersea — Cables, Landing Stations.
- All header buttons, map markers, tooltips, and Intel Feed events now follow this protocol consistently.

---

## 🔧 Technical Details

| Area | Change |
| :--- | :--- |
| `buildRepeaterLayers.ts` | Cluster halo color → Emerald; tighter grid; zoom threshold 7.5 |
| `buildInfraLayers.ts` | New file: Deck.gl layers for cables + landing stations |
| `useInfraData.ts` | 24h `localStorage` cache; SubmarineCableMap.com proxy |
| `TacticalMap.tsx` | Race condition fix for RF_NET notification; infra toggle observer |
| `IntelFeed.tsx` | Fixed `ReferenceError`; Cyan theme for infra events |
| `SystemStatus.tsx` | "Total Tracking" label; Landing Stations default OFF; Emerald/Cyan toggle buttons |
| `MapTooltip.tsx` | Dedicated Cyan tooltip for cables & stations; Emerald for repeaters |
| `LayerFilters.tsx` | Color-coded infra toggle switches (Emerald + Cyan + Black Circle) |
| `README.md` | Fixed Mermaid diagram; added `## Data Sources` section |
| `CHANGELOG.md` | Full `[0.12.0]` entry |

**No breaking API or schema changes.** No new environment variables required.

---

## ⬆️ Upgrade Instructions

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart (no dependency changes required)
docker compose up -d --build frontend

# Verify services
docker compose ps
```

> _No database migrations required._