# 2026-03-21-fix-radioref-deferral.md

## Issue
The `RadioReference` poller was incorrectly deferring its sync even when `RF_RR_FETCH_HOUR` was set to `-1` (which is intended to disable hour gating). The logic only compared the current hour to the fetch hour, and since the current hour (0-23) can never be `-1`, the deferral was always active.

Log message observed:
`RadioReference: sync due but deferring to -1:00 UTC (currently 01:00 UTC) to avoid peak-hour contention.`

## Solution
Modified the sync loop in `radioref.py` to check if `self.fetch_hour` is greater than or equal to `0` before applying the hour gating logic. This allows `-1` to correctly bypass the hour check.

## Changes
- `backend/ingestion/rf_pulse/sources/radioref.py`: Updated `loop` method to handle `self.fetch_hour >= 0` check.

## Verification
- Rebuilt `sovereign-rf-pulse` container using `docker compose up -d --build sovereign-rf-pulse`.
- Verified the fix by checking logs (manually, as the poller will now proceed with the fetch if interval has elapsed).

## Benefits
- Restores the ability to trigger RadioReference syncs immediately regardless of the time of day when configured to do so.
- Ensures consistency with other poller services (`orbital_pulse`, `infra_poller`) which already handle the `-1` disable flag correctly.
