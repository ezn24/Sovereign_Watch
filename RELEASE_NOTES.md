# Release - v0.13.2 - Container Stability Patch

This is a fast-follow patch release focusing on Docker container stability for operators standing up Sovereign Watch on Windows host machines. It addresses a critical flaw that prevented the HF intelligence bridge (JS8Call) from starting.

## Key Fixes

- **Cross-Platform Container Builds:** Resolved an issue where Windows Git configurations would inadvertently check out shell scripts with `CRLF` line endings. This caused fatal "file not found" execution errors when Docker attempted to run `entrypoint.sh` inside the Linux JS8Call container. We have introduced strict `.gitattributes` to enforce `LF` endings for all scripts globally.
- **Database Auth Synchronization:** Corrected environment variable defaults that caused backend authentication failures during initial TimescaleDB volume creation.

## Upgrade Instructions

To apply this patch, pull the latest code and rebuild the affected containers:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart the platform (specifically JS8Call)
docker compose up -d --build
```
