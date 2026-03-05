import React, { useState } from 'react';
import { MapPin, Trash2, ChevronDown, Crosshair } from 'lucide-react';
import { MissionLocation } from '../../types';

// Mission Presets - aligned with documentation
const MISSION_PRESETS = [
  { radius: 30, icon: '✈️', label: 'Airport Ops', color: 'text-cyan-400' },
  { radius: 100, icon: '🏙️', label: 'Metro Area', color: 'text-blue-400' },
  { radius: 150, icon: '🌊', label: 'Coastal Region', color: 'text-emerald-400' },
  { radius: 250, icon: '🌐', label: 'Maximum Range', color: 'text-red-400' },
];

interface MissionNavigatorProps {
  savedMissions: MissionLocation[];
  currentMission: { lat: number; lon: number; radius_nm: number } | null;
  onSwitchMission: (mission: MissionLocation) => void;
  onDeleteMission: (id: string) => void;
  onPresetSelect: (radius: number) => void;
}

export const MissionNavigator: React.FC<MissionNavigatorProps> = ({
  savedMissions,
  currentMission,
  onSwitchMission,
  onDeleteMission,
  onPresetSelect,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-black/40 backdrop-blur-md border border-hud-green/20 rounded shadow-lg">
      {/* Header */}
      <button
        className="w-full text-left px-3 py-2 bg-gradient-to-b from-hud-green/10 to-transparent border-b border-hud-green/20 cursor-pointer focus-visible:ring-1 focus-visible:ring-hud-green outline-none"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="mission-navigator-content"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair size={12} className="text-hud-green/60" />
            <span className="text-[10px] text-hud-green/80 uppercase font-bold tracking-wider">
              Mission Areas
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-hud-green/40 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
        {currentMission && (
          <div className="text-[9px] text-white/40 font-mono mt-1">
            Active: {currentMission.lat.toFixed(2)}°, {currentMission.lon.toFixed(2)}° 
            ({currentMission.radius_nm}nm)
          </div>
        )}
      </button>

      {expanded && (
        <div id="mission-navigator-content" className="p-2 space-y-3">
          {/* Mission Presets */}
          <div>
            <div className="text-[9px] text-white/30 uppercase tracking-wide mb-1.5">
              Quick Select
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {MISSION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onPresetSelect(preset.radius)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-hud-green/30 rounded p-1.5 transition-all group text-left focus-visible:ring-1 focus-visible:ring-hud-green outline-none"
                  aria-label={`Select ${preset.label} preset`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base" aria-hidden="true">{preset.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white/80 font-medium truncate">
                        {preset.label}
                      </div>
                      <div className="text-[8px] text-white/40 font-mono">
                        {preset.radius}nm
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Saved Locations */}
          {savedMissions.length > 0 && (
            <div>
              <div className="text-[9px] text-white/30 uppercase tracking-wide mb-1.5">
                Saved Locations ({savedMissions.length})
              </div>
              <ul className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar m-0 p-0 list-none">
                {savedMissions.map((mission) => (
                  <li
                    key={mission.id}
                    className="w-full bg-white/5 border border-white/10 rounded group relative flex items-stretch focus-within:border-hud-green/30 focus-within:bg-hud-green/5"
                  >
                    <button
                      onClick={() => onSwitchMission(mission)}
                      className="flex-1 min-w-0 p-2 text-left hover:bg-hud-green/10 transition-colors rounded-l focus-visible:ring-1 focus-visible:ring-hud-green outline-none focus-visible:bg-hud-green/10"
                      aria-label={`Switch to mission ${mission.name}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <MapPin size={10} className="text-hud-green/60 flex-shrink-0" aria-hidden="true" />
                        <span className="text-[10px] text-white/90 font-medium truncate">
                          {mission.name}
                        </span>
                      </div>
                      <div className="text-[9px] text-white/40 font-mono">
                        {mission.lat.toFixed(2)}°, {mission.lon.toFixed(2)}° • {mission.radius_nm}nm
                      </div>
                    </button>
                    <button
                      onClick={() => onDeleteMission(mission.id)}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-red-400/60 hover:text-red-400 hover:bg-white/5 transition-all p-2 rounded-r focus-visible:ring-1 focus-visible:ring-red-400 outline-none flex items-center justify-center"
                      aria-label={`Delete mission ${mission.name}`}
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {savedMissions.length === 0 && (
            <div className="text-center py-4 text-white/20 text-[10px]">
              No saved locations yet.
              <br />
              Right-click the map to save.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
