# Infrastructure Poller — User Guide

> **Container:** `sovereign-infra-poller`
> **Source Code:** `backend/ingestion/infra_poller/`
> **Storage:** Redis (no Kafka output — data served directly via API)

---

## Overview

The Infra Poller monitors two categories of global infrastructure:

1. **Internet Outages** — Real-time global internet disruption data from Georgia Tech's **IODA** (Internet Outage Detection and Analysis) project.
2. **Submarine Cable Network** — Global undersea fiber optic cable routes and landing station locations from **TeleGeography's Submarine Cable Map**.

Unlike the aviation and maritime pollers, the Infra Poller does **not** publish to Kafka. Instead, it fetches data on a schedule and stores it in **Redis**, where the Backend API serves it directly to the frontend on demand.

---

## Data Sources

### Internet Outages — IODA

| Feed | URL | Auth Required |
| :--- | :--- | :--- |
| **IODA v2 Summary** | `api.ioda.inetintel.cc.gatech.edu/v2/outages/summary` | No |

IODA monitors global internet connectivity using three measurement methodologies:
- **BGP routing** — Monitors Border Gateway Protocol announcements for route withdrawals
- **Active probing (merit-nt)** — Active pings to address blocks
- **Ping slash-24 (ping-slash24)** — Sampling of /24 address blocks

Sovereign Watch uses IODA's **overall composite score** for each country. Scores are normalized to a 0–100 severity scale using a logarithmic function (to compress the very wide range of IODA raw scores).

> Outages with a raw score below 1,000 are suppressed as noise.

### Submarine Cables — TeleGeography

| Feed | URL | Auth Required |
| :--- | :--- | :--- |
| **Cable GeoJSON** | `submarinecablemap.com/api/v3/cable/cable-geo.json` | No |
| **Landing Points GeoJSON** | `submarinecablemap.com/api/v3/landing-point/landing-point-geo.json` | No |

---

## Polling Rates

| Data Type | Interval | Redis Key |
| :--- | :--- | :--- |
| Internet outages (IODA) | Every **30 minutes** | `infra:outages` |
| Submarine cable routes | Every **24 hours** | `infra:cables` |
| Landing station locations | Every **24 hours** | `infra:stations` |

The poller runs a simple `while True` loop sleeping 60 seconds between checks; actual fetches only fire when their respective interval has elapsed since the last successful fetch.

---

## Outage Severity Scoring

IODA's raw scores span many orders of magnitude (thousands to trillions). Sovereign Watch normalizes them using:

```
severity = (log10(raw_score) / 12.0) × 100
```

- **log10(1,000) = 3** → ~25% severity (minor)
- **log10(1,000,000) = 6** → 50% severity (moderate)
- **log10(1,000,000,000,000) = 12** → 100% severity (catastrophic)

Scores are clamped to the 0–100 range. Only the top **200 most severe** country-level outages are stored per fetch cycle.

### Geocoding

IODA provides country codes but not coordinates. The poller uses **Nominatim** (OpenStreetMap's geocoding service) to resolve country names to lat/lon points. A 1-second delay between Nominatim requests is enforced as per their usage policy.

Geocoded coordinates are **in-memory cached** for the lifetime of the container to minimize Nominatim requests.

---

## Data Flow

```
IODA API (every 30 min)
    ↓  (HTTPS REST JSON)
fetch_internet_outages()
    ↓  (filter score < 1000; log-normalize severity)
geocode_region()  →  Nominatim (with in-memory cache)
    ↓  (GeoJSON FeatureCollection)
Redis: infra:outages  →  GET /api/infra/outages

Submarine Cable Map API (every 24 h)
    ↓  (HTTPS REST GeoJSON)
fetch_cables_and_stations()
    ↓
Redis: infra:cables    →  GET /api/infra/cables
Redis: infra:stations  →  GET /api/infra/stations
```

---

## Configuration

| Variable | Default | Description |
| :--- | :--- | :--- |
| `REDIS_URL` | `redis://sovereign-redis:6379/0` | Full Redis connection URL |

The polling intervals are hardcoded constants in `main.py`:

| Constant | Value |
| :--- | :--- |
| `POLL_INTERVAL_IODA_MINUTES` | `30` |
| `POLL_INTERVAL_CABLES_HOURS` | `24` |

---

## Tactical Display

### Internet Outage Layer

Active internet outages are visualized on the Tactical Map as **pulsating circles** at country center coordinates:

| Severity | Color |
| :--- | :--- |
| High (> 66%) | Red |
| Medium (33–66%) | Amber/Orange |
| Low (< 33%) | Yellow |

### Submarine Cable Layer

- **Cable routes** — Rendered as lines connecting continents, colored by cable system.
- **Landing stations** — Rendered as distinctive markers at coastal cable termination points.

Both layers can be toggled via the **Infrastructure** panel in the Settings HUD.

---

## Troubleshooting

| Symptom | Likely Cause | Resolution |
| :--- | :--- | :--- |
| No outage data visible | IODA API temporarily unavailable | Check logs; data will refresh on next 30-minute cycle |
| Outages at (0, 0) coordinates | Nominatim geocoding failed for that country | Known limitation for very small or new country codes |
| Cable layer missing | Submarine Cable Map API unavailable | Check logs; data cached for 24 hours — previous data will persist in Redis |
| Redis key not found (`infra:outages`) | Poller not yet completed first fetch | Wait up to 30 minutes after container start |

---

## Related

- [Configuration Reference](../Configuration.md)
- [API Reference — Infrastructure](../API_Reference.md#infrastructure)
