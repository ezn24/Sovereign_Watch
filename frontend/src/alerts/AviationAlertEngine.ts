import type { EntityClassification } from "../types";

export const EMERGENCY_SQUAWKS = new Set(["7500", "7600", "7700"]);

/**
 * Returns a stable key identifying the current emergency state for an aircraft,
 * or an empty string if no emergency is active.
 */
export function getEmergencyKey(
  classification?: EntityClassification,
): string {
  if (
    classification?.squawk &&
    EMERGENCY_SQUAWKS.has(classification.squawk)
  ) {
    return `squawk:${classification.squawk}`;
  }
  if (
    classification?.emergency &&
    classification.emergency !== "none" &&
    classification.emergency !== ""
  ) {
    return `emergency:${classification.emergency}`;
  }
  return "";
}

/** Builds a human-readable alert message for a given emergency key. */
export function buildAlertMessage(
  callsign: string,
  emergencyKey: string,
): string {
  if (emergencyKey.startsWith("squawk:")) {
    const squawk = emergencyKey.slice(7);
    if (squawk === "7500") return `SQUAWK 7500 — ${callsign} (HIJACK)`;
    if (squawk === "7600") return `SQUAWK 7600 — ${callsign} (Radio Failure)`;
    if (squawk === "7700") return `SQUAWK 7700 — ${callsign} (Emergency)`;
  }
  if (emergencyKey.startsWith("emergency:")) {
    const type = emergencyKey.slice(10);
    return `EMERGENCY — ${callsign}: ${type.toUpperCase()}`;
  }
  return `ALERT — ${callsign}`;
}
