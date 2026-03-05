# Task: Optimize Satellite Array Traversal

## Date: 2026-03-04

## Overview
Optimized the redundant array traversals in the frontend layer construction logic. Specifically, `find()` calls for selected entities were being executed multiple times per render cycle in `OrbitalLayer.tsx` and `buildTrailLayers.ts`.

## Changes
- **OrbitalLayer.tsx**: Cached the result of `satellites.find()` for the selected entity into a `selectedSat` variable. Reused this variable for both the conditional check and the layer data.
- **buildTrailLayers.ts**: Cached the result of `interpolated.find()` for the selected entity into a `selectedEntity` variable, removing redundant searches.

## Performance Impact
Reduces the number of linear searches (O(N)) in high-frequency rendering loops. These functions are called on every animation frame/map movement, so caching the lookup result provides a direct constant-factor CPU efficiency improvement for the UI thread.

## Verification
- Code review performed and confirmed correctness.
- Manual inspection of logic ensures functional equivalence.
- Memory recording updated with the pattern.
