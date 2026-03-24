# 2026-03-24 Frontend Modularization Release

## Issue
A frontend refactor PR introduced substantial structural changes across dashboard rendering, feed filtering, and entity worker orchestration. The release documentation needed to capture these changes clearly for operators and developers, and package metadata needed to reflect a new release.

## Solution
Executed the release documentation workflow for a patch release (`v0.47.1`) focused on internal modularization and maintainability improvements, while preserving runtime behavior.

## Changes
- Updated `CHANGELOG.md`
  - Added release section `0.47.1` with categorized entries for:
    - Added modular alert engines, event filters, widgets, and worker/utilities
    - Changed orchestration in `useEntityWorker.ts`, `DashboardView.tsx`, and `IntelFeed.tsx`
    - Fixed consistency risk from duplicated inline logic
- Updated `RELEASE_NOTES.md`
  - Replaced prior notes with `v0.47.1 - Frontend Modularization`
  - Documented high-level value, key features, technical details, and upgrade instructions
- Updated `frontend/package.json`
  - Bumped version from `0.47.0` to `0.47.1`

## Verification
- `cd frontend && pnpm run lint && pnpm run test` -> pass (eslint clean; vitest 36/36 passing)
- `docker compose build frontend` -> blocked on host (`docker` command not found in current environment)
- Sanity: confirmed release documents are present and aligned with the frontend refactor scope

## Benefits
- Improves release traceability for a major internal frontend refactor.
- Keeps package metadata synchronized with release documentation.
- Provides operators and contributors clear upgrade and validation guidance.
