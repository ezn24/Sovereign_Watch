# Release v0.14.0 - Orbital Synchronization

This major release marks the official launch of the **Orbital Map** suite, a massive expansion and synchronization of Sovereign Watch's space-domain tracking capabilities. Following the `SATELLITE-DASHBOARD-RESEARCH.md` directives, v0.14.0 introduces the dedicated **Orbital Dashboard**, high-performance 3D globe visualization, and real-time high-frequency (5s) satellite propagation.

## 🛰️ Major Enhancements

- **Dedicated Orbital Dashboard:** A new, separate view mode (accessible via the TopBar) designed specifically for satellite operations.
- **3D Globe Projection:** Native spherical visualization Mode for satellites, ensuring accurate global situational awareness.
- **Real-Time High-Frequency Propagation:** Reduced SGP4 propagation interval from 30s to **5s** in the `orbital-pulse` poller for near-real-time accuracy.
- **Satellite Inspector Sidebar:** Deep telemetry view for selected satellites, including NORAD ID, inclination, velocity, and altitude.
- **Orbital Category Filtering:** Operates across GPS, COMMS, WEATHER, and INTEL satellite groups with unified tactical coloring.
- **Tactical Coverage Footprints:** Real-time 2D visualization of a satellite's field-of-view on the Earth's surface.
- **Day/Night Terminator Layer:** Integrated global shadow overlay providing critical operational context for satellite passes.

## 🛠️ Performance & HUD Alignment

- **Vectorized Position Logic:** Optimized the backend propagation loop for high-density fleets like Starlink.
- **Unified HUD Controls:** TACTICAL, ORBITAL, and RADIO modes are now parity-aligned in the TopBar.
- **Map Control Synchronization:** Tactical and Orbital map zoom controls are now unified in the bottom-center "Hot Plate" layout.

## 📋 Upgrade Instructions

This release requires a backend service restart to apply the new 5s propagation cadence.

```bash
# Update local repository
git pull origin main

# Rebuild and restart all services
docker compose down && docker compose up -d --build
```

---
_Operational Status: v0.14.0 Launch Complete._
