# 2026-03-24 Fix Trail Smoothing Typecheck

## Issue
Frontend typecheck smoke failed with `TS2322` in `src/utils/trailSmoothing.ts` because `getSmoothedTrail` declared a tuple return type (`[number, number, number][]`) while returning values from `chaikinSmooth`, which is typed as `number[][]`.

## Solution
Aligned `getSmoothedTrail` return type to `number[][]`, matching both `chaikinSmooth` output and `CoTEntity.smoothedTrail` contract.

## Changes
- Updated `frontend/src/utils/trailSmoothing.ts`
  - Changed `getSmoothedTrail` return type from `[number, number, number][]` to `number[][]`.

## Verification
- `cd frontend && pnpm run typecheck` -> pass
- `cd frontend && pnpm run lint && pnpm run test` -> pass (36 tests)

## Benefits
- Removes blocking TypeScript regression from release smoke checks.
- Restores consistency between smoothing utility output and entity model typing.
