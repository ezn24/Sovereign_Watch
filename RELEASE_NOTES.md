# Release - v0.29.0 - Core Engine Refactor

## High-Level Summary
This release focuses on architectural health, modularity, and technical debt reduction. By refactoring the project's most complex component—the 900+ line `useAnimationLoop` hook—we have created a more maintainable and testable foundation for future real-time rendering features. This "under-the-hood" cleanup improves developer velocity and reduces the risk of regressions during future layer development.

## Key Features
- **Modular Animation Engine**: The main animation loop has been reduced by 45% (from 924 to 516 lines). High-frequency tasks like Projective Velocity Blending (PVB), entity filtering, and Deck.gl layer composition have been extracted into dedicated utilities and modules.
- **Centralized Constants**: Maritime classification maps are now centralized in a shared constants file, ensuring consistency across the entire UI and simplifying future taxonomy updates.
- **Database Schema Consolidation**: Redundant migration scripts have been removed, with the primary `init.sql` now acting as the single source of truth for the TimescaleDB/PostGIS schema.
- **Clean Test Bed**: Improved test suite hygiene by resolving unused variable warnings in the core API test modules.

## Technical Details
- **New Utilities**:
  - `frontend/src/utils/interpolation.ts`: Shared PVB logic for aircraft, ships, and satellites.
  - `frontend/src/utils/filters.ts`: Centralized visibility rules for all tracked entities.
- **New Composition Layer**:
  - `frontend/src/layers/composition.ts`: Orchestrates 10+ Deck.gl layer builders into a single, cohesive stack.
- **File Removals**:
  - `backend/db/migrate_*.sql` (5 files): Redundant migration history.
  - `backend/database/retention_policy.sql`: Superseded by `init.sql`.

## Upgrade Instructions
1. Pull the latest `main` branch.
2. Rebuild the frontend: `docker compose build frontend` (or `npm install` if running locally to register new files).
3. Restart the stack: `docker compose up -d`.
4. Run a health check: `docker compose logs -f backend` to ensure `init.sql` is applied correctly.
