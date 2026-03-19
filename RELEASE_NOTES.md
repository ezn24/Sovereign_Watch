# Release - v0.37.2 - Hardened Replay

## Summary

v0.37.2 is a focused patch release that closes a **critical security vulnerability**, stabilizes the Replay Historian introduced in v0.37.1, and improves developer tooling and accessibility. Operators should upgrade immediately due to the rate-limit fix.

---

## Security Fix (Upgrade Required)

### [CRITICAL] DoS & Cost-Exhaustion: Missing Rate Limit on Analysis Endpoint (PR #150)

A missing rate limit on the `/api/analysis` endpoint allowed any client to submit unbounded AI inference requests, creating a vector for both service disruption and runaway LLM API costs. A per-IP request limit is now enforced on all analysis requests.

**Impact**: Without this fix, an unauthenticated actor could exhaust inference quotas or degrade service response times for all users.

---

## Key Fixes

### Replay Historian: Initialization Crash

Resolved an `Uncaught ReferenceError: Cannot access 'updateReplayFrame' before initialization` that crashed the application on load. The `updateReplayFrame` callback was declared after `loadReplayData` which referenced it — a JavaScript temporal dead zone violation introduced when the historian was merged. The declaration order has been corrected.

### Replay Playback Time-Range & Missing Tracks (PR #149)

Fixed incorrect time-range boundary selection in the replay query that caused recently active tracks to be absent from playback. Playback now correctly initializes at the start of the selected window and includes all tracks active during the period.

### MCP LSP Configuration: Docker / Local-Binary Dual-Path (PR #148)

Resolved broken LSP MCP server startup for environments without Docker. Wrapper scripts now auto-detect Docker availability and fall back to the local binary seamlessly. Relative workspace paths are used in `.mcp.json` to ensure portability across developer machines.

### Accessibility: Accordion Toggles now Semantic Buttons (PR #151)

`<div>` elements used as accordion toggles have been replaced with `<button>` elements. This satisfies WCAG 2.1 keyboard navigation and screen reader requirements and eliminates browser accessibility warnings.

---

## Upgrade Instructions

```bash
# Pull latest changes
git pull origin dev

# Rebuild and restart all services
docker compose up -d --build

# Verify backend is running
docker compose ps
```

---

*For a full list of changes, see [CHANGELOG.md](CHANGELOG.md).*
