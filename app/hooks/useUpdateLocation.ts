// hooks/useSmoothedLocation.ts
import { useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { decodedToken } from '../utils/utils';
import { getCurrentLocation, requestLocationPermission } from '../services/locationService';
import { usePubNubService } from '../services/pubnubService';
import { getHeadingAsync } from 'expo-location';

const SMOOTHING_FACTOR = 0.3;
const INTERVAL_MS = 5000;

type Location = { latitude: number; longitude: number; heading: number };

/**
 * A custom hook that manages smoothed location updates every INTERVAL_MS ms.
 * Usage:
 *   const currentLoc = useSmoothedLocation();
 */
export function useSmoothedLocation(): Location {
  const { user, token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id as string | undefined;
  const { publishLocation } = usePubNubService();

  const [currentLoc, setCurrentLoc] = useState<Location>({
    latitude: 0,
    longitude: 0,
    heading: 0,
  });
  const lastLocation = useRef<Location>(currentLoc);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchAndUpdate = async () => {
      if (!(await requestLocationPermission()) || !userId) return;
      const { coords } = await getCurrentLocation();
      const bearing = await getHeadingAsync();
      const raw: Location = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        heading: bearing.trueHeading,
      };

      const smoothed: Location = {
        latitude: lastLocation.current.latitude
          ? lastLocation.current.latitude + SMOOTHING_FACTOR * (raw.latitude - lastLocation.current.latitude)
          : raw.latitude,
        longitude: lastLocation.current.longitude
          ? lastLocation.current.longitude + SMOOTHING_FACTOR * (raw.longitude - lastLocation.current.longitude)
          : raw.longitude,
        heading: raw.heading,
      };

      const changed =
        smoothed.latitude !== lastLocation.current.latitude ||
        smoothed.longitude !== lastLocation.current.longitude ||
        smoothed.heading !== lastLocation.current.heading;

      if (changed) {
        lastLocation.current = smoothed;
        setCurrentLoc(smoothed);
        publishLocation(userId, user, smoothed.latitude, smoothed.longitude, smoothed.heading);
      }
    };

    // initial and interval
    fetchAndUpdate();
    timer = setInterval(fetchAndUpdate, INTERVAL_MS);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user, token]);

  return currentLoc;
}
