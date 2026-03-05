import React from 'react';

interface PassPoint {
  azimuth: number;    // 0-360 degrees
  elevation: number;  // 0-90 degrees
  time: string;       // ISO datetime
  isAos?: boolean;
  isTca?: boolean;
  isLos?: boolean;
}

interface PolarPlotWidgetProps {
  pass?: {
    points: PassPoint[];
  };
  /** If omitted the SVG is 100% width/height of its container */
  width?: number;
  height?: number;
}

export const PolarPlotWidget: React.FC<PolarPlotWidgetProps> = ({ pass, width, height }) => {
  // Use fixed logical units so the SVG can scale fluidly
  const vw = width ?? 260;
  const vh = height ?? 260;
  const cx = vw / 2;
  const cy = vh / 2;
  const radius = Math.min(vw, vh) / 2 - 24;

  /** Polar → SVG. North is up (az=0 → top). */
  function toXY(az: number, el: number) {
    const r = radius * (1 - el / 90);
    const angle = (az - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  // Elevation rings: horizon (0°), 30°, 60°
  const rings = [0, 30, 60];

  let pathD = '';
  let aosXY: { x: number; y: number } | null = null;
  let tcaXY: { x: number; y: number } | null = null;
  let losXY: { x: number; y: number } | null = null;

  if (pass && pass.points.length > 0) {
    pass.points.forEach((p, i) => {
      const { x, y } = toXY(p.azimuth, p.elevation);
      pathD += i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
      if (p.isAos) aosXY = { x, y };
      if (p.isTca) tcaXY = { x, y };
      if (p.isLos) losXY = { x, y };
    });
  }

  const isEmpty = !pass || pass.points.length === 0;

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 shrink-0">
        <span className="text-[10px] font-bold tracking-[0.2em] text-purple-400/70 uppercase">
          Pass Geometry
        </span>
        {!isEmpty && (
          <div className="flex items-center gap-2 text-[8px] font-mono text-white/30">
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />AOS
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400" />TCA
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />LOS
            </span>
          </div>
        )}
      </div>

      {/* SVG — fills all remaining space */}
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center py-2 px-2">
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          className="w-full h-full"
          style={{ maxHeight: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Elevation rings */}
          {rings.map((el) => {
            const r = radius * (1 - el / 90);
            return (
              <g key={el}>
                <circle
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke="#ffffff"
                  opacity={el === 0 ? 0.15 : 0.07}
                  strokeWidth={el === 0 ? 0.8 : 0.5}
                />
                {el > 0 && (
                  <text
                    x={cx + 4}
                    y={cy - r + 9}
                    fill="#ffffff"
                    opacity="0.25"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    {el}°
                  </text>
                )}
              </g>
            );
          })}

          {/* Cardinal cross-hairs */}
          <line x1={cx} y1={cy - radius} x2={cx} y2={cy + radius} stroke="#ffffff" opacity="0.1" strokeWidth="0.5" />
          <line x1={cx - radius} y1={cy} x2={cx + radius} y2={cy} stroke="#ffffff" opacity="0.1" strokeWidth="0.5" />

          {/* Cardinal labels */}
          <text x={cx} y={cy - radius - 6} fill="#ffffff" opacity="0.35" fontSize="9" textAnchor="middle" fontFamily="monospace">N</text>
          <text x={cx} y={cy + radius + 13} fill="#ffffff" opacity="0.35" fontSize="9" textAnchor="middle" fontFamily="monospace">S</text>
          <text x={cx + radius + 7} y={cy + 4} fill="#ffffff" opacity="0.35" fontSize="9" textAnchor="start" fontFamily="monospace">E</text>
          <text x={cx - radius - 7} y={cy + 4} fill="#ffffff" opacity="0.35" fontSize="9" textAnchor="end" fontFamily="monospace">W</text>

          {/* Empty state message */}
          {isEmpty && (
            <text x={cx} y={cy + 4} fill="#ffffff" opacity="0.2" fontSize="9" textAnchor="middle" fontFamily="monospace">
              No pass in range
            </text>
          )}

          {/* Pass arc */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.8"
              opacity="0.85"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* AOS / TCA / LOS markers */}
          {aosXY && <circle cx={(aosXY as { x: number; y: number }).x} cy={(aosXY as { x: number; y: number }).y} r="3.5" fill="#22c55e" opacity="0.9" />}
          {tcaXY && (
            <circle
              cx={(tcaXY as { x: number; y: number }).x}
              cy={(tcaXY as { x: number; y: number }).y}
              r="4.5"
              fill="#a855f7"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.95"
            />
          )}
          {losXY && <circle cx={(losXY as { x: number; y: number }).x} cy={(losXY as { x: number; y: number }).y} r="3.5" fill="#ef4444" opacity="0.9" />}
        </svg>
      </div>
    </div>
  );
};
