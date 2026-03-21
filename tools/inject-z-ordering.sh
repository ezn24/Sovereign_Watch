#!/usr/bin/env bash
# PreToolUse hook — injects z-ordering.md once per session when editing map/layer files.
# Saves ~4k tokens on sessions that never touch the frontend layer stack.
# Uses a temp lockfile so the content is injected at most once per session.

set -euo pipefail

LOCK="/tmp/sw-z-ordering-injected"

# Already injected this session — skip.
[[ -f "$LOCK" ]] && exit 0

# Parse file_path from the tool input JSON on stdin.
input=$(cat)
file_path=$(echo "$input" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input', {}).get('file_path', ''))" \
  2>/dev/null || true)

# Only trigger for frontend layer and map component files.
if [[ "$file_path" == *"frontend/src/layers/"* ]] || \
   [[ "$file_path" == *"frontend/src/components/map/"* ]] || \
   [[ "$file_path" == *"frontend/src/hooks/useAnimationLoop"* ]]; then
  touch "$LOCK"
  echo "## Z-Ordering Rules (auto-injected — editing a layer/map file)"
  cat agent_docs/z-ordering.md
fi
