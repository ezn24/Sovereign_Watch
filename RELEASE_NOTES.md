# Release - v0.32.1 - Network Mobility

## Summary
Version 0.32.1 is a critical stability release focusing on **Network Mobility** and **Deployment Resiliency**. It eliminates the "localhost friction" encountered when deploying Sovereign Watch to remote servers or local network nodes, ensuring the platform remains accessible and functional across various network topologies.

## Key Fixes
- **Dynamic Origin Discovery**: The frontend now automatically detects and adapts to the host server's IP address for all WebSocket telemetry (JS8, Audio, Tracks), removing the need for manual URL configuration.
- **CORS Centralization**: All Cross-Origin Resource Sharing policies are now controlled via a single `ALLOWED_ORIGINS` variable in the root `.env` file.
- **Secure Context Fallbacks**: Implemented fallback unique identifier generation to support non-secure (HTTP) environments, which are common when accessing the platform via local IP.

## Technical Details
- Added `window.location.host` derivation logic to `useJS8Stations.ts` and `useListenAudio.ts`.
- Updated `docker-compose.yml` to inject environment-driven origins into the backend-api and js8call-bridge containers.
- Added Pseudo-Random fallback for `crypto.randomUUID()` in `App.tsx`.

## Upgrade Instructions
1. Update your `.env` file to include your server's IP in `ALLOWED_ORIGINS`.
2. Rebuild and restart:
```bash
docker compose up -d --build
```
