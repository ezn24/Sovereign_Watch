import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { MapFilters, PassResult } from '../../types';
import { OrbitalCategoryPills } from '../widgets/OrbitalCategoryPills';
import { PolarPlotWidget } from '../widgets/PolarPlotWidget';
import { PassPredictorWidget } from '../widgets/PassPredictorWidget';
import { DopplerWidget } from '../widgets/DopplerWidget';
import { usePassPredictions } from '../../hooks/usePassPredictions';
import { useMissionLocation } from '../../hooks/useMissionLocation';

interface OrbitalSidebarLeftProps {
    filters: MapFilters;
    onFilterChange: (key: string, value: unknown) => void;
    selectedSatNorad: number | null;
    setSelectedSatNorad: (noradId: number | null) => void;
    trackCount: number;
}

export const OrbitalSidebarLeft: React.FC<OrbitalSidebarLeftProps> = ({
    filters,
    onFilterChange,
    selectedSatNorad,
    setSelectedSatNorad,
    trackCount
}) => {
    const { lat: observerLat, lon: observerLon } = useMissionLocation();
    const [minElevation, setMinElevation] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const { passes, loading } = usePassPredictions(observerLat, observerLon, { minElevation });

    const [selectedPassIndex, setSelectedPassIndex] = useState(0);
    const selectedPass: PassResult | undefined = passes[selectedPassIndex];

    const query = searchTerm.trim().toLowerCase();
    const filteredPasses = query
        ? passes.filter(p =>
            p.name.toLowerCase().includes(query) ||
            String(p.norad_id).includes(query)
          )
        : passes;

    const widgetPasses = filteredPasses.map((p) => ({
        norad_id: parseInt(p.norad_id, 10) || 0,
        name: p.name,
        aos: p.aos,
        tca: p.tca,
        los: p.los,
        max_elevation: p.max_elevation,
        aos_azimuth: p.aos_azimuth,
        los_azimuth: p.los_azimuth,
        duration_seconds: p.duration_seconds,
    }));

    const dopplerPoints = selectedPass?.points.map((pt) => ({
        time: pt.t,
        slant_range_km: pt.slant_range_km,
        elevation: pt.el,
    })) ?? [];

    const polarPass = selectedPass
        ? {
              points: selectedPass.points.map((pt, i) => ({
                  azimuth: pt.az,
                  elevation: pt.el,
                  time: pt.t,
                  isAos: i === 0,
                  isTca: pt.t === selectedPass.tca,
                  isLos: i === selectedPass.points.length - 1,
              })),
          }
        : undefined;

    const handlePassClick = (norad: number) => {
        const idx = passes.findIndex((p) => parseInt(p.norad_id, 10) === norad);
        if (idx >= 0) setSelectedPassIndex(idx);
        setSelectedSatNorad(norad);
    };

    return (
        <div className="flex flex-col h-full gap-2 animate-in fade-in duration-1000">
            <OrbitalCategoryPills filters={filters} onFilterChange={onFilterChange} trackCount={trackCount} />

            {/* NORAD / Name search */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-black/30 border border-white/10 backdrop-blur-md">
                <Search size={11} className="text-white/30 shrink-0" />
                <input
                    type="text"
                    placeholder="Search by name or NORAD ID…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-[10px] font-mono text-white/80 placeholder-white/20 outline-none"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="text-white/30 hover:text-white/60 text-[10px] leading-none"
                    >
                        ×
                    </button>
                )}
            </div>

            <PassPredictorWidget
                passes={widgetPasses}
                homeLocation={{ lat: observerLat, lon: observerLon }}
                onPassClick={handlePassClick}
                isLoading={loading}
                minElevation={minElevation}
                onMinElevationChange={setMinElevation}
            />

            {selectedSatNorad && <DopplerWidget passPoints={dopplerPoints} />}
            <div className="mt-auto">
                <PolarPlotWidget pass={polarPass} />
            </div>
        </div>
    );
};
