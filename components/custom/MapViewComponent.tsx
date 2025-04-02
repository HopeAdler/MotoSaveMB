import React, { useEffect, useRef } from "react";
import MapboxGL from "@rnmapbox/maps";
import { View } from "react-native";
import UserMarker from "./UserMarker";
import MyLocationButton from "./MyLocationButton";
import { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";
import { User } from "../../app/context/formFields";

type Users = Map<string, User>;

const { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } = process.env;
const { EXPO_PUBLIC_GOONG_MAP_KEY } = process.env;

type MapViewComponentProps = {
  users: Users;
  currentLoc: { latitude: number; longitude: number };
  focusMode: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  children?: React.ReactNode;
  isActionSheetOpen: boolean;
};

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  users,
  currentLoc,
  focusMode: [focusOnMe, setFocusOnMe],
  children,
  isActionSheetOpen,
}) => {
  const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${EXPO_PUBLIC_GOONG_MAP_KEY}`;
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  MapboxGL.setAccessToken(`${EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`);

  useEffect(() => {
    if (focusOnMe && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
        zoomLevel: 14,
        animationDuration: 1000,
      });
    }
  }, [focusOnMe, currentLoc]);

  const locationButtonOffset = useSharedValue(10);
  useEffect(() => {
    locationButtonOffset.value = withTiming(isActionSheetOpen ? 150 : 10, { duration: 300 });
  }, [isActionSheetOpen]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    bottom: locationButtonOffset.value,
  }));

  return (
    <View className="flex-1">
      <MapboxGL.MapView styleURL={loadMap} ref={mapRef} style={{ flex: 1 }}>
        <MapboxGL.Camera ref={cameraRef} zoomLevel={14} />

        {Array.from(users.entries()).map(([key, user]) => (
          <UserMarker key={key} user={user} />
        ))}

        {children}
      </MapboxGL.MapView>

      <MyLocationButton onPress={() => setFocusOnMe(!focusOnMe)} isActionSheetOpen={isActionSheetOpen} />
    </View>
  );
};

export default MapViewComponent;
