import { CoTEntity } from "../../types";

/** 10-stop altitude color gradient with gamma correction - TACTICAL THEME (Green->Red) */
export const ALTITUDE_STOPS: [number, [number, number, number]][] = [
  [0.0, [0, 255, 100]], // Green (ground)
  [0.1, [50, 255, 50]], // Lime
  [0.2, [150, 255, 0]], // Yellow-green
  [0.3, [255, 255, 0]], // Yellow
  [0.4, [255, 200, 0]], // Gold
  [0.52, [255, 150, 0]], // Orange
  [0.64, [255, 100, 0]], // Red-orange
  [0.76, [255, 50, 50]], // Red
  [0.88, [255, 0, 100]], // Crimson
  [1.0, [255, 0, 255]], // Magenta (max alt)
];

export function altitudeToColor(
  altitudeMeters: number,
  alpha: number = 220,
): [number, number, number, number] {
  if (altitudeMeters == null || altitudeMeters < 0)
    return [100, 100, 100, alpha];
  const MAX_ALT = 13000; // meters
  const normalized = Math.min(altitudeMeters / MAX_ALT, 1.0);
  const t = Math.pow(normalized, 0.4); // Gamma compress — more variation at low altitudes

  // Find surrounding stops
  for (let i = 0; i < ALTITUDE_STOPS.length - 1; i++) {
    const [t0, c0] = ALTITUDE_STOPS[i];
    const [t1, c1] = ALTITUDE_STOPS[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
        alpha,
      ];
    }
  }
  const last = ALTITUDE_STOPS[ALTITUDE_STOPS.length - 1][1];
  return [last[0], last[1], last[2], alpha];
}

/** Speed-based color for maritime entities (knots) - WATER THEME (Blue->Cyan) */
export const SPEED_STOPS_KTS: [number, [number, number, number]][] = [
  [0, [0, 50, 150]], // Dark Blue — Anchored/Drifting
  [2, [0, 100, 200]], // Medium Blue
  [8, [0, 150, 255]], // Bright Blue
  [15, [0, 200, 255]], // Light Blue
  [25, [200, 255, 255]], // Cyan/White — High speed
];

export function speedToColor(
  speedMs: number,
  alpha: number = 220,
): [number, number, number, number] {
  const kts = speedMs * 1.94384;
  for (let i = 0; i < SPEED_STOPS_KTS.length - 1; i++) {
    const [s0, c0] = SPEED_STOPS_KTS[i];
    const [s1, c1] = SPEED_STOPS_KTS[i + 1];
    if (kts >= s0 && kts <= s1) {
      const f = (kts - s0) / (s1 - s0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
        alpha,
      ];
    }
  }
  // Above max stop
  const last = SPEED_STOPS_KTS[SPEED_STOPS_KTS.length - 1][1];
  return [last[0], last[1], last[2], alpha];
}

/** Unified color for any entity based on type */
export function entityColor(
  entity: CoTEntity,
  alpha: number = 220,
): [number, number, number, number] {
  if (entity.type.includes("S")) {
    return speedToColor(entity.speed, alpha);
  }
  return altitudeToColor(entity.altitude, alpha);
}
