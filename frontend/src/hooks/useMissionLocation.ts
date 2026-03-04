import { useState, useEffect } from 'react';
import { getMissionArea } from '../api/missionArea';

const DEFAULT_LAT = parseFloat(import.meta.env.VITE_CENTER_LAT || '45.5152');
const DEFAULT_LON = parseFloat(import.meta.env.VITE_CENTER_LON || '-122.6784');

/**
 * Returns the observer lat/lon from the active mission area,
 * falling back to VITE_CENTER_LAT/LON env vars.
 */
export function useMissionLocation(): { lat: number; lon: number } {
  const [location, setLocation] = useState({ lat: DEFAULT_LAT, lon: DEFAULT_LON });

  useEffect(() => {
    getMissionArea()
      .then((m) => {
        if (m?.lat && m?.lon) setLocation({ lat: m.lat, lon: m.lon });
      })
      .catch(() => {});
  }, []);

  return location;
}
