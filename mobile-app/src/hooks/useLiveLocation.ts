/**
 * Live location detection — uses browser Geolocation API on web.
 *
 * Reverse-geocodes the user's coords to the nearest known city + sector from
 * our catalog. This avoids asking the user to type their location manually.
 *
 * On native (Expo Go), falls back to a manual entry signal (caller should keep
 * the input field visible).
 */
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { fetchCities } from '../services/api';

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export type LocationStatus = 'idle' | 'detecting' | 'ready' | 'denied' | 'error' | 'unsupported';

export const useLiveLocation = () => {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [match, setMatch] = useState<{ city: string; city_name: string; sector: string; distance_km: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    fetchCities()
      .then((r) => setCities(r.cities || []))
      .catch(() => {});
  }, []);

  const detect = useCallback(async () => {
    setError(null);

    // Native fallback
    if (Platform.OS !== 'web') {
      setStatus('unsupported');
      setError(
        'Live location works in the web preview. On Expo Go, please type the city and sector manually.'
      );
      return null;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      setError('Geolocation API not available in this browser');
      return null;
    }

    setStatus('detecting');

    return new Promise<{ city: string; sector: string } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });

          // Find the nearest sector across all cities
          let bestMatch: any = null;
          let bestDist = Infinity;
          for (const c of cities) {
            for (const s of c.sectors || []) {
              const d = haversineKm(latitude, longitude, s.lat, s.lng);
              if (d < bestDist) {
                bestDist = d;
                bestMatch = { city: c.id, city_name: c.name_en, sector: s.id, distance_km: d };
              }
            }
          }
          if (bestMatch) {
            setMatch(bestMatch);
            setStatus('ready');
            resolve({ city: bestMatch.city, sector: bestMatch.sector });
          } else {
            setStatus('error');
            setError('No nearby sector found in catalog');
            resolve(null);
          }
        },
        (err) => {
          if (err.code === 1) {
            setStatus('denied');
            setError('Location permission denied — allow it in your browser settings.');
          } else if (err.code === 2) {
            setStatus('error');
            setError('Could not determine location (position unavailable)');
          } else if (err.code === 3) {
            setStatus('error');
            setError('Location request timed out');
          } else {
            setStatus('error');
            setError(err.message || 'Location detection failed');
          }
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [cities]);

  return { status, coords, match, error, detect, citiesLoaded: cities.length > 0 };
};
