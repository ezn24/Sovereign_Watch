# Sovereign Watch: Technical Roadmap

This document outlines the trajectory for the Sovereign Watch platform. For current system architecture and operational guides, please refer to the [Documentation/](./Documentation/) directory.

## 1. Executive Summary

Sovereign Watch is transitioning from initial feature parity to a **Version 1.0 Release Candidate**. Our focus is shifting from "Core Ingestion" to "Analytical Utility" and "Collaborative Features."

- **Strategic Vision**: Reclaiming data sovereignty through active, self-hosted multi-INT fusion.
- **Current Status**: Phase 2 (Active). Core pipelines for Aviation (ADS-B), Maritime (AIS), and Orbital (TLE) are stable.
- **Archive**: For a full list of completed milestones, see [COMPLETED_ARCHIVE.md](./agent_docs/COMPLETED_ARCHIVE.md).

---

## 2. Technical Architecture Reference

The platform's "System of Systems" architecture is documented in detail within the following resources:

| Domain        | Documentation                                                                                                                                                                                                          |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ingestion** | [Aviation](./Documentation/pollers/ADSB.md), [Maritime](./Documentation/pollers/AIS.md), [Orbital](./Documentation/pollers/Orbital.md), [Infra](./Documentation/pollers/Infra.md), [RF](./Documentation/pollers/RF.md) |
| **Protocol**  | [TAK Protocol Reference (CoT/Protobuf)](./Documentation/TAK_Protocol.md)                                                                                                                                               |
| **Storage**   | [API Reference (TimescaleDB/PostgreSQL)](./Documentation/API_Reference.md)                                                                                                                                             |
| **Interface** | [UI User Guide](./Documentation/UI_Guide.md)                                                                                                                                                                           |

---

## 3. Version 1.0 Release Candidate Requirements

These core components and usability improvements define the transition to a full production v1.0 state.

| ID         | Task Name            | Component | Description                                                                                                    |
| :--------- | :------------------- | :-------- | :------------------------------------------------------------------------------------------------------------- |
| **FE-14**  | Deep Linking         | Frontend  | **(Collaboration)**. Encode mission state (Lat/Lon/Zoom/Active Layers) into the URL hash for instant sharing.  |
| **FE-15**  | Data Portability     | Frontend  | **(Collaboration)**. Export/Import active mission state (AOR, Layer Filters, Preferences) to JSON.             |
| **FE-12**  | Settings UI          | Frontend  | **(Usability)**. Configure API keys and Poller internals via the UI instead of `.env` files.                   |
| **AI-01**  | AI Analyst Panel     | Frontend  | **(Intelligence)**. Surface the existing `/api/analyze/{uid}` LLM capability into a dedicated frontend widget. |
| **FE-22**  | Drone Tactical Layer | Frontend  | **(Tracking)**. Implement `DroneLayer.tsx` with rotor icons and `drone_class` color coding.                    |
| **FE-25c** | PSAP / 911 Centers   | Frontend  | **(Tracking)**. Static GeoJSON markers for emergency dispatch centers.                                         |

---

## 4. Backlog (P2)

| ID            | Task Name             | Component | Description                                                           |
| :------------ | :-------------------- | :-------- | :-------------------------------------------------------------------- |
| **Ingest-11** | FCC ASR Tower Service | Data Eng  | FCC antenna structure DB -> bounding-box filtered endpoints.          |
| **FE-25b**    | FCC Tower Layer       | Frontend  | Visual markers for communication towers by height and type.           |
| **FE-10**     | Payload Eval          | Frontend  | Raw JSON inspector (Terminal Mode).                                   |
| **FE-13**     | Mission Labels        | Frontend  | Floating text labels for coverage areas.                              |
| **Ingest-07** | Drone Remote ID       | Data Eng  | OpenDroneID / FAA Remote ID SDR pipeline (Requires RTL-SDR hardware). |

---

## 5. Future Scope (P3 — Phase 6+)

- **Concurrent Multi-Area Polling**: Support for multiple independent surveillance zones.
- **Mission Analytics**: Heatmaps and density metrics over time.
- **Multi-User Sync**: Real-time collaborative WebSocket mission synchronization.
- **SGP4 WebGPU Physics**: Offloading orbital propagation to a headless compute worker.

---

- **Last Updated**: 2026-03-14 (Refactored for focus).
