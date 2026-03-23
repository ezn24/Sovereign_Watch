# Fix: GDELT Tooltip TONE (GS) / STATUS Uses Goldstein Scale

## Issue

In `MapTooltip.tsx` (lines 356–376), the `TONE (GS)` label and `STATUS` thresholds were
reading from `entity.detail?.tone` (GDELT Average Tone). However, the label abbreviation
"GS" stands for **Goldstein Scale**, which is stored separately as `entity.detail?.goldstein`.
This mismatch meant the displayed value and STATUS thresholds did not match the dot color
(`toneColor`) used on the map, which is based on the Goldstein Scale.

## Solution

Replace all `entity.detail?.tone` references inside the `TONE (GS)` and `STATUS` sections
with `entity.detail?.goldstein` so that the tooltip value and conflict thresholds are
consistent with the Goldstein-derived `toneColor` visualization.

## Changes

- `frontend/src/components/map/MapTooltip.tsx`
  - `TONE (GS)` value: `entity.detail?.tone` → `entity.detail?.goldstein`
  - `TONE (GS)` color class: threshold check uses `goldstein` instead of `tone`
  - `STATUS` color class and threshold checks: all `tone` refs → `goldstein`
  - Also replaced `|| 0` with `?? 0` for correctness when the value is `0`

## Verification

- TypeScript type safety preserved — `goldstein` is typed as `number` in `GdeltPoint`
  (`buildGdeltLayer.ts:12`) and present in the feature properties mapping (line 116).
- Manual inspection confirms the changed lines now consistently use `goldstein` throughout.

## Benefits

- Tooltip now accurately reflects the Goldstein Scale value used to color map dots.
- STATUS labels (CRITICAL / TENSION / STABLE) are now driven by the same metric as the
  visual encoding, removing the confusion between AvgTone and Goldstein Scale.
