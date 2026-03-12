# Release - v0.26.1 - Kinetic Calm

## Summary
This patch release focuses on the stability of the KiwiSDR integration. By introducing intelligent backend debouncing, we have resolved intermittent connection breaks and rate-limiting issues that occurred during rapid manual tuning or slider adjustments.

## Key Fixes
- **Command Debouncing**: Added a 500ms delay to hardware-level SET commands (Freq/AGC/Squelch), ensuring only the final intended state is transmitted to the remote SDR hardware.
- **Connection Resilience**: Reduced the risk of "429 Too Many Requests" from public KiwiSDR nodes by throttling retune frequency.

## Technical Details
- Modified `KiwiClient` to use an internal task-based debouncing helper.
- Verified fix with a new async unit test suite in the `js8call` service.

## Upgrade Instructions
```bash
docker compose up -d --build js8call
```
