# Release - v0.34.1 - Stability & Performance Overhaul

## High-Level Summary
This release focuses on critical infrastructure stability and container performance after the migration to the `uv` Python package manager. We addressed several "cold-boot" regressions that were causing services to fail on startup or experience significant lag.

## Key Fixes
- **Unified Venv Path**: Moved all virtual environments to `/opt/venv` to prevent Docker volume masking, ensuring dependencies are always available regardless of source-mount configuration.
- **Boot Optimization**: Implemented `--no-sync` and pre-compiled bytecode to reduce service startup times.
- **Build Isolation**: Added comprehensive `.dockerignore` patterns to fix context transfer issues on Windows hosts.

## Technical Details
- **Dependency Management**: Standardized on `uv` patterns for all Python services (FastAPI + Pollers).
- **Base Image Compatibility**: Relaxed `js8call` requirements to match Ubuntu 22.04 LTS system Python (3.10.x).

## Upgrade Instructions
1. Pull the latest `dev` branch.
2. Rebuild the core service stack:
   ```bash
   docker compose build backend-api adsb-poller ais-poller orbital-pulse infra-poller rf-pulse
   ```
3. Restart all services:
   ```bash
   docker compose up -d
   ```
