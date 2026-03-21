# 2026-03-21-remove-rf-clustering.md

## Issue
RF repeater nodes were being clustered on the map, which the user wanted to remove completely. Additionally, the clustering logic in `buildRFLayers.ts` was likely behaving incorrectly because the `zoom` parameter was not being passed by the caller in `composition.ts`, leading to `NaN` grid sizes.

## Solution
Removed all clustering logic from the RF layer generation pipeline. All RF sites are now rendered as individual points regardless of zoom level.

## Changes
- **`frontend/src/layers/buildRFLayers.ts`**:
    - Removed `RFCluster` interface.
    - Removed `clusterRFSites` function.
    - Removed `zoom` parameter from `buildRFLayers`.
    - Removed cluster-specific `ScatterplotLayer` and `TextLayer`.
    - Simplified rendering to only use the individual site `ScatterplotLayer`.
    - Removed unused `TextLayer` import.

## Verification
- Ran `pnpm run lint` in the `frontend` directory. While the project has 28 deferred warnings (tracked in `LINT_DEFERRED.md`), the changes in `buildRFLayers.ts` did not introduce new issues and resolved a new `unused-var` warning for `TextLayer`.
- The `buildRFLayers` function's new signature remains compatible with its only caller in `composition.ts`, which was already omitting the `zoom` argument.

## Benefits
- Cleaner map display for RF sites (consistent with user preference).
- Prevents potential crashes or rendering bugs caused by the missing `zoom` parameter in the clustering logic.
- Reduced bundle size and complexity by removing unused clustering code.
