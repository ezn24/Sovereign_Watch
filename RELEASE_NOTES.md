# Release - v0.41.1 - Polling Resilience Patch

This patch update focuses on stabilizing and improving the transparency of our data ingestion pipelines, specifically for RadioReference and FCC infrastructure datasets.

### High-Level Summary
This release resolves a configuration bug that prevented immediate RadioReference syncs and addresses visibility issues during large FCC historical downloads. Operators can now more reliably trigger immediate refreshes and monitor progress during initial deployment.

### Key Fixed
- **RadioReference Syncing**: Fixed a logic error in the `rf_pulse` poller where an "immediate sync" setting (`-1`) was interpreted as a deferred hour. Syncs now trigger correctly based on interval when the hour gate is disabled.
- **FCC Progress Visibility**: Improved the `infra_poller` download loop. By reducing chunk sizes and boosting progress logging to the `INFO` level, we've eliminated "silent hangs" during the 35 MB FCC Structures download from data.fcc.gov.

### Technical Details
- **Poller Logic**: `fetch_hour` check in `radioref.py` now explicitly guards with `self.fetch_hour >= 0`.
- **Download Parameters**: `infra_poller` chunking reduced to 1 MB; read timeout tightened to 60s for faster failover.

### Upgrade Instructions
To apply these fixes, pull the latest code and rebuild the ingestion services:
```bash
docker compose up -d --build sovereign-rf-pulse sovereign-infra-poller
```
No database migrations are required for this patch.
