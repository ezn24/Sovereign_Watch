import type { VesselClassification } from "../types";

/** AIS nav status codes that warrant an alert. */
export const DISTRESS_NAV_STATUSES: Record<number, string> = {
  2: "NOT UNDER COMMAND",
  6: "AGROUND",
  14: "AIS-SART DISTRESS",
};

/**
 * Returns a stable key identifying the current distress state for a vessel,
 * or an empty string if no distress condition is active.
 */
export function getMaritimeAlertKey(
  vesselClassification?: VesselClassification,
): string {
  const navStatus = vesselClassification?.navStatus;
  if (navStatus !== undefined && navStatus in DISTRESS_NAV_STATUSES) {
    return `navStatus:${navStatus}`;
  }
  return "";
}

/** Builds a human-readable alert message for a given maritime alert key. */
export function buildMaritimeAlertMessage(
  callsign: string,
  alertKey: string,
): string {
  const code = parseInt(alertKey.slice("navStatus:".length), 10);
  const label = DISTRESS_NAV_STATUSES[code] ?? "MARITIME ALERT";
  return `${label} — ${callsign}`;
}
