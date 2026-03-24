import type { IntelEvent, MapFilters } from "../types";

/**
 * Returns false if the maritime event should be hidden by the current filters.
 * Assumes event.entityType === "sea" and filters.showSea === true.
 */
export function filterMaritimeEvent(
  event: IntelEvent,
  filters: MapFilters,
): boolean {
  const cat = event.classification?.category;
  if (!cat) return true;

  if (cat === "cargo" && filters.showCargo === false) return false;
  if (cat === "tanker" && filters.showTanker === false) return false;
  if (cat === "passenger" && filters.showPassenger === false) return false;
  if (cat === "fishing" && filters.showFishing === false) return false;
  if (cat === "military" && filters.showSeaMilitary === false) return false;
  if (cat === "law_enforcement" && filters.showLawEnforcement === false)
    return false;
  if (cat === "sar" && filters.showSar === false) return false;
  if (cat === "tug" && filters.showTug === false) return false;
  if (cat === "pleasure" && filters.showPleasure === false) return false;
  if (cat === "hsc" && filters.showHsc === false) return false;
  if (cat === "pilot" && filters.showPilot === false) return false;
  if ((cat === "special" || cat === "unknown") && filters.showSpecial === false)
    return false;

  return true;
}
