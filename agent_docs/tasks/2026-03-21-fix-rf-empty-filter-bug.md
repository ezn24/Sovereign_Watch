# 2026-03-21-fix-rf-empty-filter-bug.md

## Issue
When all service sub-filters (Ham, NOAA, Public Safety) were disabled but the RF repeater master toggle remained ON, the map unexpectedly populated with ALL RF nodes. This happened because the empty services array was treated as "all services" by the fetch hook and potentially by the backend API.

## Solution
Updated the `useRFSites` hook to correctly handle the case where "repeaters are enabled but no specific services are selected". In this state, the hook now clears any existing data and aborts the fetch process, ensuring no nodes are rendered on the map.

## Changes
- **`frontend/src/hooks/useRFSites.ts`**:
    - Added a check in the main `useEffect` to return early and clear the site data if `enabled` is true but the `services` list is empty.
    - Removed a redundant second `useEffect` that was only handling the `!enabled` case.
    - Removed an unused `RFService` import (also fixed a lint warning).

## Verification
- Ran `pnpm run lint` in the `frontend` directory. Verified that the total number of lint warnings decreased from 28 to 27, confirming the removal of the unused `RFService` import.
- The logic flow ensures that if a user unchecks all service boxes, the map correctly shows no repeater sites until at least one service category is re-enabled.

## Benefits
- Corrected counter-intuitive filtering behavior.
- Reduced unnecessary API calls when no data is intended to be shown.
- Small code cleanup/lint fix.
