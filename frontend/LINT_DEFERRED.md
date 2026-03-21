# Deferred Lint Warnings

These warnings were left in place intentionally during the `no-explicit-any` cleanup
session (2026-03-20) to keep scope manageable. Each item is annotated with a suggested
action so they can be resolved in an IDE review.

Branch where cleanup was done: `claude/cleanup-frontend-linting-X3Rbe`

---

## `@typescript-eslint/no-unused-vars` (22 warnings)

### `src/App.tsx`

| Line | Symbol | Notes |
|------|--------|-------|
| 28 | `NOOP` | `const NOOP = () => {}` — defined but never referenced. Either delete it or find the prop it was meant to satisfy. |
| 186 | `towersLoading` | Destructured from `useTowers()` but never used in JSX. Add a loading indicator or drop the destructure. |

### `src/components/map/MapLibreAdapter.tsx`

| Line | Symbol | Notes |
|------|--------|-------|
| 10 | `_globeMode` | Prop is destructured but the 3D globe logic was never wired up in this adapter. Remove from destructure or implement. |
| 30 | `e` | Event parameter in a handler — likely `(e) => { ... }` where `e` is unused. Prefix with `_` or remove. |

### `src/components/map/MapboxAdapter.tsx`

| Line | Symbol | Notes |
|------|--------|-------|
| 43 | `e` | Same pattern as MapLibreAdapter. Prefix with `_` or remove. |

### `src/components/map/OrbitalMap.tsx`

| Line | Symbol | Notes |
|------|--------|-------|
| 140 | `onMissionPropsReady` | Prop is accepted and destructured but never called. The comment at line 592 says it's "handled inside useMissionArea" — verify or remove the prop from the interface. |
| 169 | `showTerminator` | Prop accepted but not forwarded to the layer composition call. Wire it up or remove it. |
| 183 | `hoveredInfra` | State is set by `setHoveredInfraState` but the value is never read. The hover tooltip for orbital infra may be unfinished — either wire up the tooltip or remove the state. |
| 332 | `dataReady` | `const dataReady = rfSitesRef?.current && ...` — computed but never used in any conditional. Delete the assignment. |

### `src/components/map/TacticalMap.tsx`

| Line | Symbol | Notes |
|------|--------|-------|
| 193 | `_` | Likely a destructured variable intentionally ignored. The `_` prefix suppresses the warning in most linters; ESLint still flags it here. Rename to `__` or remove entirely. |

### `src/components/widgets/IntelFeed.tsx`

| Line | Symbol | Notes |
|------|--------|-------|
| 191 | `filters` | Prop is received but not used inside the component body. Either the filtering logic was removed or never implemented — delete from the props interface if unneeded. |
| 198 | `isSea` | `const isSea = event.entityType === 'sea'` — computed but no sea-specific branch uses it. Delete or use in an icon/colour differentiation. |

### `src/components/widgets/OrbitalCategoryPills.tsx`

| Line | Symbol | Notes |
|------|--------|-------|
| 63 | `count` | `const count = stats ? stats[cat.statsKey] : null` — stats display was stubbed but never rendered. Either show the count badge or remove it. |

### `src/components/widgets/TimeControls.tsx`

| Line | Symbol | Notes |
|------|--------|-------|
| 2 | `FastForward`, `SkipBack`, `X`, `Radio` | Four Lucide icon imports that are unused. The replay control UI was partially built — either add the buttons or remove the imports. |
| 31 | `onClose` | Prop defined in the interface (`onClose: () => void // Exit replay mode`) and destructured, but never called in the JSX. Wire up to an exit button or remove. |

### `src/hooks/useMapCamera.ts`

| Line | Symbol | Notes |
|------|--------|-------|
| 231 | `_` | Same `_` naming issue as TacticalMap.tsx. |

### `src/hooks/useRFSites.ts`

| Line | Symbol | Notes |
|------|--------|-------|
| 2 | `RFService` | Imported from `../types` but not used anywhere in this file. Remove the import. Simple one-liner fix. |

### `src/layers/OrbitalLayer.tsx`

| Line | Symbol | Notes |
|------|--------|-------|
| 111 | `showFootprints` | Parameter is destructured from `OrbitalLayerProps` with a default of `false`, but no footprint rendering logic exists. Either implement satellite footprint polygons or remove the prop. |

---

## `react-hooks/exhaustive-deps` (7 warnings)

These are intentional "run-once" or "run-on-mount" effects that use refs/callbacks
deliberately excluded from the dependency array to avoid re-render loops.
Each one should be reviewed to confirm the intent is correct.

### `src/App.tsx`

| Line | Details |
|------|---------|
| 591 | Missing `replayTime` in a `useEffect`. If the effect should respond to time scrubbing, add it. If it should only run on replay start/stop, the exclusion may be correct — add an `// eslint-disable-next-line` with an explanation. |

### `src/components/map/OrbitalMap.tsx`

| Line | Details |
|------|---------|
| 383 | Missing `selectedEntity`. If the effect syncs selected entity to an external system, add it and verify the effect body is idempotent. |
| 652 | Missing `entitiesRef`. Since `entitiesRef` is a ref (`.current` never changes identity), this is safe to exclude — add a disable comment explaining that. |

### `src/hooks/useAnimationLoop.ts`

| Line | Details |
|------|---------|
| 478 | **Large list of missing deps** — this is the main render loop `useEffect`. Almost all deps are refs (`.current` objects) intentionally excluded so the loop doesn't restart on every data update. This is the correct pattern for a Deck.gl animation loop. Add a single `// eslint-disable-next-line react-hooks/exhaustive-deps` with a comment: *"Refs are stable; restarting the loop on every data update would break animation."* |

### `src/hooks/useEntityWorker.ts`

| Line | Details |
|------|---------|
| 749 | Missing `currentMissionRef`. Ref — same reasoning as above, safe to disable with a comment. |

### `src/hooks/useMapCamera.ts`

| Line | Details |
|------|---------|
| 75 | Missing `mapInstanceRef`, `mapRef`, `setEnable3d`. Mixed bag — `mapInstanceRef`/`mapRef` are refs (safe to exclude), but `setEnable3d` from a parent could legitimately change. Audit whether `setEnable3d` is wrapped in `useCallback` in the parent; if not, add that or disable with a comment. |
| 139 | Missing `mapRef`. Ref — safe disable with comment. |
| 218 | Missing `mapRef`. Ref — safe disable with comment. |

---

## Summary

| Category | Count | Effort |
|----------|-------|--------|
| Simple deletes (unused imports/vars) | 8 | < 30 min |
| Unfinished UI features (TimeControls, OrbitalCategoryPills, hoveredInfra, footprints) | 6 | Medium — need design decision |
| Unimplemented props (onClose, filters in IntelFeed, showTerminator) | 4 | Small — wire up or remove |
| Safe exhaustive-deps disables (ref-only deps) | 5 | < 30 min — add disable comments |
| Exhaustive-deps requiring audit (setEnable3d, replayTime, selectedEntity) | 3 | Medium — check parent components |
