import type { IntelEvent, MapFilters } from "../types";

/**
 * Returns false if the orbital event should be hidden by the current filters.
 * Assumes event.entityType === "orbital" and filters.showSatellites === true.
 *
 * Category is inferred from the event message or classification when explicit
 * classification is unavailable (e.g. events generated from callsign/name text).
 */
export function filterOrbitalEvent(
  event: IntelEvent,
  filters: MapFilters,
): boolean {
  const msg = event.message?.toLowerCase() || "";
  const classification = (event.classification?.category || "").toLowerCase();

  if (
    msg.includes("gps") ||
    msg.includes("gnss") ||
    classification.includes("gps")
  ) {
    return filters.showSatGPS !== false;
  }

  if (
    msg.includes("weather") ||
    msg.includes("noaa") ||
    classification.includes("weather")
  ) {
    return filters.showSatWeather !== false;
  }

  if (
    msg.includes("comms") ||
    msg.includes("communications") ||
    msg.includes("starlink") ||
    classification.includes("comms")
  ) {
    return filters.showSatComms !== false;
  }

  if (
    msg.includes("intel") ||
    msg.includes("surveillance") ||
    msg.includes("military") ||
    classification.includes("surveillance")
  ) {
    return filters.showSatSurveillance !== false;
  }

  // Debris, active unclassified, etc.
  return filters.showSatOther !== false;
}
