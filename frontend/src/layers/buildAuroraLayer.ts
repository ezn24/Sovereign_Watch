/**
 * buildAuroraLayer — NOAA Auroral Oval visualization layer.
 *
 * Renders the NOAA 1-hour aurora forecast as a smooth, continuous band using
 * HeatmapLayer (GPU-side Gaussian KDE) to eliminate the grid-dot pattern that
 * appeared with the previous ScatterplotLayer approach.
 *
 * A secondary ScatterplotLayer overlays a per-point shimmer/glow on
 * high-intensity (≥40%) regions for the animated corona effect.
 *
 * Data source: /api/space-weather/aurora (GeoJSON FeatureCollection)
 * Each feature: Point geometry, property `aurora` (0–100).
 */

import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer } from "@deck.gl/layers";

interface AuroraFeature {
  geometry: { coordinates: [number, number] };
  properties: { aurora: number };
}

/**
 * Aurora green color ramp for HeatmapLayer colorRange (6 RGBA stops,
 * low-weight → high-weight).  Alpha ramps from 0 so the quiet baseline
 * fades cleanly into the map.
 */
const AURORA_COLOR_RANGE: [number, number, number, number][] = [
  [0, 80, 60, 0],       // 0 – transparent (invisible quiet regions)
  [0, 140, 80, 90],     // 1 – dark teal-green, faint
  [20, 220, 60, 150],   // 2 – bright green
  [40, 255, 100, 185],  // 3 – green-cyan
  [80, 255, 160, 210],  // 4 – bright cyan-green
  [210, 255, 220, 235], // 5 – near-white peak
];

/**
 * Per-point shimmer color for the high-intensity glow pass.
 * Uses the point's longitude as a phase offset so adjacent points animate
 * slightly out of phase, creating an organic ripple instead of a global pulse.
 */
function shimmerColor(
  intensity: number,
  lon: number,
  now: number,
): [number, number, number, number] {
  // Offset phase by longitude (wrapping at 360°) → spatial wave effect
  const phase = now / 2500 + (lon / 360) * Math.PI * 2;
  const wave = (Math.sin(phase) + 1) / 2; // 0–1

  const t = Math.min(intensity / 100, 1.0);
  const baseAlpha = 20 + t * 60;
  const alpha = Math.round(baseAlpha + wave * 30);

  // Tint: green → cyan-white as intensity rises
  const r = Math.round(40 + t * 180);
  const g = 255;
  const b = Math.round(80 + t * 150);

  return [r, g, b, alpha];
}

export function buildAuroraLayer(
  auroraData: { features: AuroraFeature[] } | null | undefined,
  visible: boolean,
  globeMode: boolean,
  now: number,
): object[] {
  if (!visible || !auroraData?.features?.length) return [];

  // Filter to meaningful intensities (≥1% avoids cluttering quiet zones)
  const data = auroraData.features.filter(
    (f) => (f.properties?.aurora ?? 0) >= 1,
  );

  if (!data.length) return [];

  // High-intensity subset for the shimmer glow pass
  const hotData = data.filter((f) => (f.properties?.aurora ?? 0) >= 40);

  const sharedParams = {
    blend: true,
    blendFunc: [770, 1] as [number, number], // SRC_ALPHA, ONE — additive glow
  };

  return [
    // ── Layer 1: smooth continuous band via Gaussian KDE ──────────────────
    new HeatmapLayer({
      id: `aurora-heatmap-${globeMode ? "globe" : "merc"}`,
      data,
      getPosition: (d: AuroraFeature) => d.geometry.coordinates,
      getWeight: (d: AuroraFeature) => (d.properties?.aurora ?? 0) / 100,
      // radiusPixels controls the gaussian kernel spread; ~60px blends the
      // ~1° NOAA grid points (≈111 km apart) into a continuous band.
      radiusPixels: 60,
      intensity: 1.2,
      // threshold: fraction of max weight below which pixels are transparent
      threshold: 0.04,
      colorRange: AURORA_COLOR_RANGE,
      parameters: {
        ...sharedParams,
        depthTest: !!globeMode,
      },
    }),

    // ── Layer 2: shimmer/glow pass on peak-intensity regions ──────────────
    // Animates per-point with a spatially varying phase so the aurora
    // appears to ripple rather than pulse uniformly.
    new ScatterplotLayer({
      id: `aurora-shimmer-${globeMode ? "globe" : "merc"}`,
      data: hotData,
      getPosition: (d: AuroraFeature) => [
        d.geometry.coordinates[0],
        d.geometry.coordinates[1],
        0,
      ],
      // Larger than the heatmap kernel radius so glow bleeds outward softly
      getRadius: 80_000,
      radiusUnits: "meters",
      getFillColor: (d: AuroraFeature) =>
        shimmerColor(
          d.properties?.aurora ?? 0,
          d.geometry.coordinates[0],
          now,
        ),
      pickable: false,
      wrapLongitude: !globeMode,
      parameters: {
        ...sharedParams,
        depthTest: !!globeMode,
        depthBias: globeMode ? -5.0 : 0,
      },
      updateTriggers: {
        getFillColor: [now],
      },
    }),
  ];
}
