import type { IntelEvent, MapFilters } from "../types";

/**
 * Returns false if the aviation event should be hidden by the current filters.
 * Assumes event.entityType === "air" and filters.showAir === true.
 */
export function filterAviationEvent(
  event: IntelEvent,
  filters: MapFilters,
): boolean {
  const cls = event.classification;
  if (!cls) return true;

  // Platform overrides take precedence over affiliation
  if (cls.platform === "helicopter") {
    return filters.showHelicopter !== false;
  }
  if (cls.platform === "drone" || cls.platform === "uav") {
    return filters.showDrone !== false;
  }

  // Affiliation checks
  if (cls.affiliation === "military" && filters.showMilitary === false)
    return false;
  if (cls.affiliation === "government" && filters.showGovernment === false)
    return false;
  if (cls.affiliation === "commercial" && filters.showCommercial === false)
    return false;
  if (
    cls.affiliation === "general_aviation" &&
    filters.showPrivate === false
  )
    return false;

  return true;
}
