// src/app/hooks/useLocationTracking.ts
import { useState, useEffect } from "react";
import * as Location from "expo-location";

export const useLocationTracking = () => {
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLoc(location.coords);
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => setCurrentLoc(loc.coords)
      );

      return () => subscription.remove();
    })();
  }, []);
  console.log(currentLoc);
  return currentLoc;
};
