# GDELT actor1 Field: GdeltPoint & GeoJSON Mapping

## Issue

`actor1` was missing from both the `GdeltPoint` TypeScript interface and the
`GdeltFeature.properties` interface in `buildGdeltLayer.ts`. The data-mapping
loop also never read `f.properties.actor1`, so the `GdeltView` sidebar always
received `undefined` for `detail.actor1` even though the backend GDELT pipeline
(`backend/ingestion/gdelt_pulse/service.py`) already exposes `actor1` as part
of the GeoJSON feature properties.

## Solution

Added `actor1?: string` in three places inside `buildGdeltLayer.ts`:

1. **`GdeltFeature.properties`** – so TypeScript knows the incoming GeoJSON can
   carry the field.
2. **`GdeltPoint` (exported interface)** – so consumers (sidebar views, tooltips,
   etc.) can reference `actor1` with full type safety.
3. **Data-mapping loop** – `actor1: f.properties.actor1` ensures the value is
   forwarded into every mapped `GdeltPoint` object passed to Deck.gl layers and
   the click/hover callbacks.

## Changes

| File | Change |
|------|--------|
| `frontend/src/layers/buildGdeltLayer.ts` | Added `actor1?: string` to `GdeltFeature.properties`, `GdeltPoint`, and the data-mapping spread |

## Verification

- TypeScript interfaces are consistent; `GdeltView.tsx` renders `detail.actor1`
  which now resolves to the typed field rather than an ad-hoc `any` lookup.
- No other files required changes; the backend already supplies the field.

## Benefits

- **Type safety**: `detail.actor1` is now explicitly typed instead of relying on
  `as any` cast in the view component.
- **Correctness**: The ACTOR 1 row in the sidebar will display the actual actor
  name whenever the GDELT pipeline returns one, closing the data gap noted in the
  code review.
