# Release - v0.41.2 - FCC Scatter Distribution Patch

This patch resolves a "patchy" rendering issue on the Tactical Map when visualizing large volumes of FCC Antenna Structure Registration (ASR) data.

### High-Level Summary
Previously, zoomed-out views of FCC towers would show dense clusters in some areas and total voids in others, even if those areas were fully ingested. This was due to the backend serving only the "first 2000" rows in physical disk order. This release fixes this by implement randomized spatial sampling.

### Key Fixed
- **FCC Spatial Distribution**: Modernized the `infra_towers` query to use a random UUID sort. This ensures that even when a limit is hit, the results are a representative sample from the entire viewport rather than just the first available database pages.
- **Sample Density**: Increased the default tower budget from 2,000 to 10,000 unique records per viewport, greatly improving the fidelity of infrastructure scatter plots on high-resolution displays.

### Technical Details
- **Sort Logic**: Backend now explicitly uses `ORDER BY id` (where ID is a random UUID) to force a non-geographic budget distribution.
- **FastAPI Defaults**: Updated the internal `limit` parameter for the `/api/infra/towers` endpoint.

### Upgrade Instructions
Pull the latest code and the backend will auto-reload. No container rebuild is strictly necessary if HMR/Reloader is active, but a quick restart is recommended:
```bash
docker compose up -d sovereign-backend
```
No database migrations or ingest rescans are required.
