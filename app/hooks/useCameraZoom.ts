// src/app/hooks/useCameraZoom.ts
import { useEffect } from "react";
import MapboxGL from "@rnmapbox/maps";

export const useCameraZoom = (
  cameraRef: React.MutableRefObject<MapboxGL.Camera | null>,
  routeCoordinates: [number, number][]
) => {
  useEffect(() => {
    if (routeCoordinates.length > 0 && cameraRef.current) {
      const lats = routeCoordinates.map((coord) => coord[1]);
      const lngs = routeCoordinates.map((coord) => coord[0]);
      const bounds = {
        ne: [Math.max(...lngs), Math.max(...lats)],
        sw: [Math.min(...lngs), Math.min(...lats)],
      };
      cameraRef.current.setCamera({
        bounds,
        zoomLevel: 14, padding: {paddingTop: 200, paddingBottom:350, paddingLeft: 20, paddingRight: 20},
        animationDuration: 1000,
      });
      // cameraRef.current.zoomTo(16);
    }
  }, [routeCoordinates, cameraRef]);
};
