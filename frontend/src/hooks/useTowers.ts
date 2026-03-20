import { useState, useEffect } from 'react';

interface BoundingBox {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
}

export const useTowers = (bounds: BoundingBox | null) => {
    const [towers, setTowers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!bounds) {
            setTowers([]);
            return;
        }

        const fetchTowers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `/api/infra/towers?min_lat=${bounds.minLat}&min_lon=${bounds.minLon}&max_lat=${bounds.maxLat}&max_lon=${bounds.maxLon}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network error fetching FCC towers');
                const data = await response.json();

                const features = data.features || [];
                const parsedTowers = features.map((f: any) => ({
                    id: f.properties.id,
                    fccId: f.properties.fcc_id,
                    type: f.properties.type,
                    owner: f.properties.owner,
                    status: f.properties.status,
                    heightM: f.properties.height_m,
                    elevationM: f.properties.elevation_m,
                    coordinates: f.geometry.coordinates,
                }));

                setTowers(parsedTowers);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchTowers, 500); // Debounce API calls
        return () => clearTimeout(timer);
    }, [bounds]);

    return { towers, isLoading, error };
};
