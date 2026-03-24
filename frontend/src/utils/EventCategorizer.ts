import type { IntelEvent } from "../types";

export interface EventStyle {
  accentColor: string;
  textColor: string;
  borderLight: string;
}

/**
 * Derives the color accent, text color, and border class for an IntelEvent
 * based on its type, entity domain, and classification metadata.
 */
export function getEventStyle(event: IntelEvent): EventStyle {
  const isAir = event.entityType === "air";
  const isOrbital = event.entityType === "orbital";
  const isInfra = event.entityType === "infra";
  const isLost = event.type === "lost";
  const isAlert = event.type === "alert";
  const isMil = event.classification?.affiliation === "military";
  const isGov = event.classification?.affiliation === "government";
  const isRF =
    isInfra &&
    (event.message?.includes("RF") || event.message?.includes("Repeater"));
  const infraColor = isRF ? "emerald-400" : "cyan-400";

  const accentColor = isAlert
    ? "bg-alert-red"
    : isLost
      ? "bg-alert-amber"
      : isMil
        ? "bg-amber-500"
        : isGov
          ? "bg-blue-400"
          : isOrbital
            ? "bg-purple-400"
            : isInfra
              ? `bg-${infraColor}`
              : isAir
                ? "bg-air-accent"
                : "bg-sea-accent";

  const textColor = isAlert
    ? "text-alert-red"
    : isLost
      ? "text-alert-amber"
      : isMil
        ? "text-amber-500"
        : isGov
          ? "text-blue-400"
          : isOrbital
            ? "text-purple-400"
            : isInfra
              ? `text-${infraColor}`
              : isAir
                ? "text-air-accent"
                : "text-sea-accent";

  const borderLight = isAlert
    ? "border-alert-red/30"
    : isLost
      ? "border-alert-amber/30"
      : isMil
        ? "border-amber-500/30"
        : isGov
          ? "border-blue-400/30"
          : isOrbital
            ? "border-purple-400/30"
            : isInfra
              ? `border-${infraColor}/30`
              : isAir
                ? "border-air-accent/30"
                : "border-sea-accent/30";

  return { accentColor, textColor, borderLight };
}
