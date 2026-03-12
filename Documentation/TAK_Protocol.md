# TAK Protocol Reference

> **Proto Definition:** `backend/api/proto/tak.proto`
> **Compiled Module:** `backend/api/proto/tak_pb2.py`

---

## Overview

Sovereign Watch uses a **simplified Cursor on Target (CoT) protocol** as its internal data exchange format. All intelligence pollers normalize external data (ADS-B JSON, AIS messages, TLE data, RF site records) into this format before publishing to the Redpanda message bus.

The schema is defined in Protocol Buffers (proto3) but in practice **all inter-service messages are JSON-serialized** — the `.proto` file serves as the canonical schema definition and is used for type-checked deserialization on the API side.

### What is Cursor on Target (CoT)?

CoT is a U.S. military XML/JSON standard (MIL-STD-2525) for exchanging situational awareness data between tactical systems (ATAK, WinTAK, etc.). Sovereign Watch implements a lightweight subset focused on real-time telemetry for aviation, maritime, orbital, and infrastructure domains.

---

## Top-Level Structure

```json
{
  "uid": "unique-entity-identifier",
  "type": "a-f-A-C-F",
  "how": "m-g",
  "time": 1710000000000,
  "start": "2026-03-12T18:00:00Z",
  "stale": "2026-03-12T18:02:00Z",
  "point": { ... },
  "detail": { ... }
}
```

### Top-Level Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `uid` | string | Yes | Globally unique entity identifier |
| `type` | string | Yes | Hierarchical CoT type string (see below) |
| `how` | string | Recommended | How position was obtained |
| `time` | uint64 | Yes | Event timestamp (epoch **milliseconds**) |
| `start` | string | Yes | Event validity start (ISO 8601) |
| `stale` | string | Yes | Event expiry time (ISO 8601) — entity is removed from display after this |
| `point` | object | Yes | Geospatial position |
| `detail` | object | Yes | Domain-specific metadata |

---

## CoT Type String

The `type` field is a hierarchical dot-notation string derived from MIL-STD-2525:

```
a  -  f  -  A  -  C  -  F
│     │     │     │     └── Sub-platform (F=Fixed Wing, H=Helicopter, Q=Drone)
│     │     │     └──────── Platform (C=Civilian, M=Military, S=Surface/Maritime)
│     │     └────────────── Domain (A=Air, G=Ground, S=Space, s=Sea)
│     └──────────────────── Affiliation (f=Friend/Friendly)
└────────────────────────── Atom type (a=Atom)
```

### Type Values Used in Sovereign Watch

| CoT Type | Entity | Domain |
| :--- | :--- | :--- |
| `a-f-A-C-F` | Civilian fixed-wing aircraft | Aviation |
| `a-f-A-M-F` | Military fixed-wing aircraft | Aviation |
| `a-f-A-C-H` | Civilian helicopter | Aviation |
| `a-f-A-M-H` | Military helicopter | Aviation |
| `a-f-A-C-Q` | Civilian drone / RPV | Aviation |
| `a-f-A-M-Q` | Military drone / RPV | Aviation |
| `a-f-G-E-V-C` | Ground vehicle (emergency/service) | Ground |
| `a-f-S-C-M` | Maritime vessel (all types) | Maritime |
| `a-s-K` | Satellite (space vehicle) | Space |

### `how` Field Values

| Value | Meaning |
| :--- | :--- |
| `m-g` | Machine — GPS (machine-calculated from GPS source) |

---

## Point Object

```json
"point": {
  "lat": 45.5152,
  "lon": -122.6784,
  "hae": 10668.0,
  "ce": 10.0,
  "le": 10.0
}
```

| Field | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `lat` | double | degrees | WGS84 latitude (-90 to +90) |
| `lon` | double | degrees | WGS84 longitude (-180 to +180) |
| `hae` | double | meters | Height Above Ellipsoid (WGS84). Use 0 for surface/sea-level. |
| `ce` | double | meters | Circular Error — horizontal position uncertainty radius |
| `le` | double | meters | Linear Error — vertical position uncertainty |

---

## Detail Object

The `detail` object contains domain-specific metadata. All sub-objects are optional — only those relevant to the entity type are populated.

```json
"detail": {
  "contact": { ... },
  "track": { ... },
  "classification": { ... },
  "vesselClassification": { ... },
  "group": { ... },
  "status": { ... },
  "category": "comms",
  "constellation": "Starlink",
  "period_min": 95.6,
  "inclination_deg": 53.0,
  "eccentricity": 0.0001,
  "internetOutage": { ... }
}
```

---

### Contact

Identifies the entity callsign or name.

```json
"contact": {
  "callsign": "UAL123",
  "endpoint": ""
}
```

| Field | Description |
| :--- | :--- |
| `callsign` | Human-readable identifier: ICAO flight number, vessel name, satellite name, MMSI |
| `endpoint` | Network endpoint (unused in current implementation) |

---

### Track

Kinematic state vector.

```json
"track": {
  "course": 270.5,
  "speed": 245.3,
  "slope": 0.0,
  "vspeed": 0.0
}
```

| Field | Unit | Description |
| :--- | :--- | :--- |
| `course` | degrees (0–360, true north) | Ground track heading |
| `speed` | m/s | Ground speed (all domains) |
| `slope` | degrees | Flight path angle (aviation) |
| `vspeed` | ft/min | Vertical rate (aviation — standard ICAO unit) |

---

### Classification (Aviation)

Aircraft-specific metadata.

```json
"classification": {
  "affiliation": "civilian",
  "platform": "fixed_wing",
  "size_class": "heavy",
  "icao_type": "B77W",
  "category": "A5",
  "db_flags": 0,
  "operator": "United Airlines",
  "registration": "N12345",
  "description": "Boeing 777-300ER",
  "squawk": "2145",
  "emergency": ""
}
```

| Field | Description |
| :--- | :--- |
| `affiliation` | `civilian` or `military` |
| `platform` | `fixed_wing`, `helicopter`, `drone` |
| `size_class` | `light`, `medium`, `large`, `heavy` |
| `icao_type` | 4-character ICAO aircraft type designator |
| `squawk` | Mode-C transponder squawk code |
| `emergency` | Emergency type if squawk is 7500/7600/7700 |

---

### VesselClassification (Maritime)

Vessel-specific metadata derived from ITU-R M.1371.

```json
"vesselClassification": {
  "category": "cargo",
  "shipType": 72,
  "navStatus": 0,
  "hazardous": false,
  "stationType": "Class A",
  "flagMid": 338,
  "imo": 9876543,
  "callsign": "ABCD1",
  "destination": "USLAX",
  "draught": 12.5,
  "length": 300.0,
  "beam": 40.0
}
```

| Field | Description |
| :--- | :--- |
| `category` | Vessel category string (see AIS Poller guide for full list) |
| `shipType` | ITU-R M.1371 ship type code (0–99) |
| `navStatus` | AIS navigational status (0=Under Way, 1=At Anchor, etc.) |
| `hazardous` | True for tankers carrying dangerous cargo |
| `flagMid` | MID (Maritime Identification Digits) — national flag code |
| `draught` | Maximum static draught in meters |
| `length` / `beam` | Vessel dimensions in meters (from AIS dimension fields A+B and C+D) |

---

### Orbital Fields (Satellites)

Satellite-specific fields are placed directly on the `detail` object (not in a sub-message):

| Field | Type | Description |
| :--- | :--- | :--- |
| `category` | string | Satellite category: `gps`, `weather`, `comms`, `intel`, `leo`, `sar` |
| `constellation` | string | Named constellation (e.g., `Starlink`, `GPS`, `NOAA`) |
| `period_min` | double | Orbital period in minutes |
| `inclination_deg` | double | Orbital inclination in degrees |
| `eccentricity` | double | Orbital eccentricity (0 = circular, 1 = parabolic) |
| `norad_id` | int | NORAD catalog number |
| `tle_line1` / `tle_line2` | string | Raw TLE lines for client-side re-propagation |

---

### InternetOutage (Infrastructure)

```json
"internetOutage": {
  "country_code": "RU",
  "region": "Russia",
  "severity": 78.5,
  "datasource": "IODA_OVERALL"
}
```

| Field | Description |
| :--- | :--- |
| `country_code` | ISO 3166-1 alpha-2 country code |
| `region` | Human-readable country name |
| `severity` | 0.0–100.0 normalized outage severity |
| `datasource` | IODA measurement methodology |

---

## UID Conventions

| Domain | Format | Example |
| :--- | :--- | :--- |
| Aviation | ICAO Mode-S hex address (lowercase) | `a1b2c3` |
| Maritime | MMSI number (string) | `123456789` |
| Satellite | `SAT-{NORAD_ID}` | `SAT-25544` |
| Internet Outage | `outage-{country_code}` | `outage-RU` |

---

## Stale Time Conventions

| Domain | Default Stale Duration |
| :--- | :--- |
| Aviation | 120 seconds (2 minutes) |
| Maritime | 300 seconds (5 minutes) |
| Satellite | 60 seconds (1 minute) |

Entities not refreshed before their stale time are removed from the live display.

---

## Protobuf Schema (Reference)

The full `.proto` definition is at `backend/api/proto/tak.proto`. The JSON messages used in Kafka are structurally equivalent to the Protobuf schema. Key message types:

```
TakMessage → CotEvent → Detail → Contact / Track / Classification / VesselClassification / InternetOutage
```

---

## Related

- [ADS-B Poller Guide](./pollers/ADSB.md)
- [AIS Maritime Poller Guide](./pollers/AIS.md)
- [Orbital Pulse Guide](./pollers/Orbital.md)
- [API Reference](./API_Reference.md)
