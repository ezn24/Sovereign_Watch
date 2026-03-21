# 2026-03-21-sync-fcc-towers-global-network.md

## Issue
The "Global Network" filter in the sidebar (and its quick toggle icon) only controlled submarine cables, landing stations, and internet outages. FCC Towers were in the same category but had to be toggled independently, which was inconsistent with the category's "master toggle" behavior.

## Solution
Integrated the `showTowers` filter into the "Global Network" master toggle and quick toggle logic.

## Changes
- **`frontend/src/components/widgets/SystemStatus.tsx`**:
    - Updated the quick toggle (Network icon) to check both `showCables` and `showTowers` to determine its active state.
    - Updated the quick toggle click handler to turn on both cables and towers when activating, and turn all off when deactivating.
    - Updated the master category toggle in the expanded view to include `showTowers` in the `isAnyOn` check and the toggle action.
    - Updated the category header's visual state (border/background color and icon pulse) to reflect the state of FCC Towers.

## Verification
- Ran `pnpm run lint` in the `frontend` directory. No new lint regressions were introduced (28 existing warnings remain deferred per `LINT_DEFERRED.md`).
- Verified logic flow: if any network layer is on, the master toggle turns all off. If all are off, it turns on cables, outages, and towers.

## Benefits
- Improved UX consistency: users can now toggle all infrastructure layers in the "Global Network" category with a single click.
- Corrected the quick toggle icon state to accurately reflect the visibility of towers.
