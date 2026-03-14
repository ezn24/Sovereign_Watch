# Release - v0.28.4 - Radio & Maritime Refinements

This release focuses on tactical stability improvements for the Listening Post, enhanced maritime platform identification, and critical fixes for track replay integrity.

---

## 📡 KiwiSDR Audio Stability & Restart Fix

Resolved critical issues in the **Listening Post** that caused inconsistent audio playback and "stuck" connections.

- **Infinite Loop Fix**: Eliminated a bug in the `useListenAudio` hook where the WebSocket connection would enter an infinite restart loop whenever the "Playing" state flickered.
- **Improved Reconnection**: Refined `AudioContext` management to ensure the audio engine remains "warm" during temporary connection drops, enabling seamless reconnection.
- **Resource Cleanup**: The backend now proactively terminates all associated audio processes (`pacat`) and socket streams on disconnect, preventing "phantom static" from playing after a station is stopped.

## 🛳️ Enhanced AIS Vessel Identification

The **Right Sidebar** now provides faster situational awareness for maritime contacts by prioritizing the vessel's radio callsign.

- **Callsign Priority**: The **REGISTRATION** field now displays the vessel's callsign (e.g., `V7JJ2`) as the primary identifier, falling back to the IMO number if the callsign is unavailable.
- **Trimmed Display**: Callsigns are automatically trimmed of trailing whitespace for a cleaner tactical look.

## 🗂️ Fixed: Replay Category Filters (Ships & Aircraft)

- Fixed a bug where maritime and aviation category filters (Cargo, Tanker, Military, etc.) were ignored during historical track replay.
- Historical data now correctly maps vessel and aircraft classifications, ensuring that the Tactical Map filters correctly hide/show assets based on your selections in Replay mode.

---

## 📄 Upgrade Instructions

This release includes minor backend logic changes and frontend updates.

```bash
git pull origin main
docker compose up -d --build js8call frontend
```

---
*Sovereign Watch - Distributed Intelligence Fusion*
