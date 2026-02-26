# Release - v0.10.2 - Performance & UI Streamlining

This release focuses on significantly improving backend ingestion throughput, enhancing the real-time websocket broadcast stability, and refining the tactical user interface for better situational awareness.

## Key Features

- **Broadcast WebSocket Service**: Implemented a centralized O(1) broadcast manager, improving concurrent client capacity and raw message throughput by over 1.5x.
- **Maritime Ingestion Overhaul**: Switched to non-blocking Kafka sends inside the AIS Python poller, boosting ingestion speed by ~35x and eliminating stream stutter. 
- **JS8Call UI Optimization**: The secondary JS8Call window now defaults to a collapsed, space-saving layout while keeping critical data (callsign, grid, frequency) permanently visible. The redundant Radio Terminal footer has been removed.
- **Security & Stability fixes**: Added validation for historical track queries to prevent resource exhaustion, and fixed Deck.gl billboarding bugs that occasionally caused aircraft and satellite icons to disappear in Globe View.

## Upgrade Instructions

```bash
# Pull new changes
git pull origin main

# Rebuild integration services and frontend
docker compose up -d --build
```