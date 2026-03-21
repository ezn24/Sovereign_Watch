# CLAUDE.md - Claude Code Specific Overrides

> Extends AGENTS.md. Read AGENTS.md first. Rules here take precedence for Claude Code sessions.

## Verification Override (Host Tools Allowed)

Containers may not be running during Claude sessions. Run lint and unit tests on the
host directly — do NOT spin up docker compose just to verify:

```bash
cd frontend && pnpm run lint && pnpm run test
cd backend/api && ruff check . && python -m pytest
cd backend/ingestion/<poller> && ruff check . && python -m pytest
```

If containers ARE already running, prefer:

```bash
docker compose exec frontend pnpm run lint
docker compose exec backend-api ruff check .
```

**Container-first still applies for:** building images, running the application, and
ingestion poller changes (always require rebuild + restart).

## MCP / LSP Tools

MCP tool availability is detected at session start. If the `## MCP Tools Active`
banner appears above, prefer LSP tools (definition, references, hover, rename) over
grep. The playbook is injected automatically when the binary is present.

To enable: `./tools/mcp-language-server/build.sh` (requires Go 1.24+), then
`npm install -g typescript typescript-language-server pyright`.

## Map Layer Work

Z-ordering rules are injected automatically when you edit files in
`frontend/src/layers/` or `frontend/src/components/map/`. No manual read needed.

## Git Workflow

- Branch prefix MUST be: `claude/<session-id>`
- Always push with: `git push -u origin <branch-name>`
- Retry up to 4x on network failures with exponential backoff (2s, 4s, 8s, 16s)
- Never push to `main` or another user's branch without explicit permission
