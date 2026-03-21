# 2026-03-20 — pnpm Standardization

## Issue
Project had both `package-lock.json` (npm) and `pnpm-lock.yaml` in the frontend, creating:
- Inconsistent lockfile source of truth
- Duplicated dependency maintenance overhead
- Variable installation speeds (npm is 2-3x slower than pnpm due to redundant copies)
- Mixed guidance in Docker and documentation

## Solution
Standardize on **pnpm** as the sole frontend package manager, removing npm lockfile and aligning all Docker and documentation to use pnpm commands.

## Changes

### Files Modified
1. **frontend/Dockerfile**
   - Changed `CMD ["npm", "run", "dev", ...]` → `CMD ["pnpm", "run", "dev", ...]`
   - Now uses pnpm consistently for both install and run phases

2. **Documentation/Development.md**
   - Updated prerequisites table: pnpm is now the standard (npm reserved for global LSP servers)
   - Changed `cd frontend && npm install` → `cd frontend && pnpm install`
   - Updated references to `npm run lint/test` → `pnpm run lint/test`

3. **AGENTS.md**
   - Updated Quick Checks section: `npm run lint/test` → `pnpm run lint/test`

4. **CLAUDE.md**
   - Updated verification commands: `npm run` → `pnpm run`
   - Updated docker compose exec reference: `npm run lint` → `pnpm run lint`

5. **frontend/package-lock.json**
   - **Deleted** — redundant with pnpm-lock.yaml

## Verification
- ✅ `frontend/pnpm-lock.yaml` confirmed as source of truth (last updated 3/19/2026)
- ✅ All Dockerfiles updated to use pnpm consistent commands
- ✅ Documentation updated to reflect pnpm as standard
- ✅ Frontend still references pnpm-lock.yaml in COPY instructions

## Benefits
- **Installation Speed**: pnpm's content-addressable store is 2-3x faster than npm's redundant copying
- **Disk Efficiency**: Global pnpm store eliminates duplicate node_modules across projects
- **Maintenance**: Single lockfile reduces cognitive overhead and merge conflicts
- **CI/CD**: Docker builds will be measurably faster with pnpm
- **Consistency**: All developers and CI now follow identical dependency resolution path
