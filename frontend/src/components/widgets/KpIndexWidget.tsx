/**
 * KpIndexWidget — compact HUD badge showing the current NOAA Kp-index.
 *
 * Renders in a map corner as a small pill badge:
 *   Kp 3.3 | UNSETTLED
 *
 * Color-coded:
 *   Kp 0–3  → green   (quiet)
 *   Kp 4    → teal    (active)
 *   Kp 5–6  → amber   (G1–G2 storm)
 *   Kp 7+   → red     (G3+ storm)
 *
 * Polls /api/space-weather/status every 5 minutes.
 */

import { useEffect, useRef, useState } from "react";
import { SpaceWeatherStatus } from "../../types";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min

function kpColor(kp: number | null): string {
  if (kp === null) return "#6b7280"; // gray-500
  if (kp >= 7)  return "#ef4444"; // red-500
  if (kp >= 5)  return "#f59e0b"; // amber-500
  if (kp >= 4)  return "#14b8a6"; // teal-500
  return "#22c55e";               // green-500
}



interface Props {
  /** If false, widget is hidden */
  visible?: boolean;
}

export function KpIndexWidget({ visible = true }: Props) {
  const [status, setStatus] = useState<SpaceWeatherStatus | null>(null);
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const resp = await fetch("/api/space-weather/status");
      if (!resp.ok) throw new Error("not ok");
      const data: SpaceWeatherStatus = await resp.json();
      setStatus(data);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    fetchStatus();
    timerRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  const kp = status?.kp ?? null;
  const level = status?.storm_level ?? (error ? "error" : "…");
  const risk = status?.gps_degradation_risk ?? "unknown";
  const aurora = status?.aurora_active ?? false;

  const color = kpColor(kp);

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-1 bg-black/30 backdrop-blur-sm border border-white/5 rounded-full shadow-inner transition-all hover:bg-black/40 group"
      style={{
        fontFamily: "monospace",
        fontSize: 10,
        letterSpacing: "0.08em",
        userSelect: "none",
        cursor: "default",
        minWidth: 140,
      }}
      title={`NOAA Kp-index: ${kp?.toFixed(1) || "--"} | GPS Risk: ${risk.toUpperCase()}${aurora ? " | Aurora active" : ""}`}
    >
      {/* Kp indicator dot */}
      <div
        className="w-2 h-2 rounded-full shadow-lg transition-transform duration-500 group-hover:scale-110"
        style={{
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
|
      {/* Main label */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-white/40 uppercase">Kp</span>
        <span 
          className="text-xs font-bold tabular-nums"
          style={{ 
            color,
            textShadow: `0 0 8px ${color}66`
          }}
        >
          {kp !== null ? kp.toFixed(1) : "--"}
        </span>
        <div className="w-[1px] h-3 bg-white/10" />
        <span className="text-[9px] font-bold text-white/60 uppercase">
          {level.toUpperCase()}
        </span>
      </div>

      {/* Aurora indicator */}
      {aurora && (
        <div className="ml-auto">
          <span
            className="text-[10px] text-purple-400 animate-pulse drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"
            title="Aurora active"
          >
            ◈
          </span>
        </div>
      )}
    </div>
  );
}
