#!/usr/bin/env bash
# SessionStart hook — injects MCP playbook only when the bridge binary exists.
# When the binary is absent the hook outputs nothing, saving ~2k tokens per session.

set -euo pipefail

BINARY="./tools/bin/mcp-language-server"

if [[ -f "$BINARY" ]]; then
  echo "## MCP Tools Active"
  echo "The mcp-language-server binary is present. Prefer LSP tools over grep/search."
  echo "Tool selection guide:"
  cat agent_docs/mcp-agent-playbook.md
else
  # Binary not built — MCP servers cannot start. Output nothing.
  # Run ./tools/mcp-language-server/build.sh (requires Go 1.24+) to enable.
  exit 0
fi
