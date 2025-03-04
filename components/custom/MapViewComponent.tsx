import React, { useEffect, useRef } from "react";
import MapboxGL from "@rnmapbox/maps";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import UserMarker from "./UserMarker";
import { LocateFixed } from "lucide-react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import MyLocationButton from "./MyLocationButton";
import { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";

type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};

type Users = Map<string, User>;

const { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } = process.env;
const { EXPO_PUBLIC_GOONG_MAP_KEY } = process.env;
// const [showActionsheet, setShowActionsheet] = useState(false);
type MapViewComponentProps = {
  users: Users;
  currentLoc: { latitude: number; longitude: number };
  focusMode: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  children?: React.ReactNode | undefined; // Accepts any JSX elements
  isActionSheetOpen: boolean;
};

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  users,
  currentLoc,
  focusMode: [focusOnMe, setFocusOnMe],
  children, // Add children here
  isActionSheetOpen
}) => {
  const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${EXPO_PUBLIC_GOONG_MAP_KEY}`;
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const focusLoc = () => {
    setFocusOnMe(!focusOnMe);
    if (focusOnMe && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
        zoomLevel: 14,
        animationDuration: 2000,
      });
    }
    console.log("Current Users: " + users.size);
  };

  MapboxGL.setAccessToken(`${EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`);
  const locationButtonOffset = useSharedValue(10);
  useEffect(() => {
    locationButtonOffset.value = withTiming(isActionSheetOpen ? 150 : 10, { duration: 300 });
  }, [isActionSheetOpen]);
  const animatedButtonStyle = useAnimatedStyle(() => ({ bottom: locationButtonOffset.value }));
  return (
    <View className="flex-1" >
      <MapboxGL.MapView styleURL={loadMap} ref={mapRef} style={{ flex: 1 }}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
        // centerCoordinate={[currentLoc.longitude, currentLoc.latitude]}
        />
        {Array.from(users.values()).map((user) => (
          <UserMarker key={user.uuid} user={user} />
        ))}
        {children /* Render additional components passed from parent */}
      </MapboxGL.MapView>
      <View >
        {/* <<TouchableOpacity onPress={focusLoc}>
          <LocateFixed color="#0080FF" size={28} />
        </TouchableOpacity>> */}
        <MyLocationButton onPress={focusLoc} isActionSheetOpen={isActionSheetOpen} />
      </View>
    </View>
  );
};

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   map: { flex: 1 },
//   bottom: {
//     position: "absolute",
//     bottom: hp("4%"),
//     alignSelf: "center",
//   },
// });

export default MapViewComponent;

