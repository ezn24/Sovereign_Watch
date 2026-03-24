import type { CoTEntity, TrailPoint } from "../types";
import { chaikinSmooth } from "./map/geoUtils";

/**
 * Returns the smoothed trail for an entity, reusing the cached result when
 * the trail array reference has not changed.
 */
export function getSmoothedTrail(
  trail: TrailPoint[],
  existing?: CoTEntity,
): number[][] {
  if (existing?.smoothedTrail && existing.trail === trail) {
    return existing.smoothedTrail;
  }
  return trail.length >= 2
    ? chaikinSmooth(trail.map((p) => [p[0], p[1], p[2]]))
    : [];
}
