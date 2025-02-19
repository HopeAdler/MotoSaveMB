import React, { useRef, useState } from "react";
import MapboxGL from "@rnmapbox/maps";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import UserMarker from "./UserMarker";
import { LocateFixed } from "lucide-react-native";
import {
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};

type Users = Map<string, User>;

type MapViewComponentProps = {
  users: Users;
  currentLoc: { latitude: number; longitude: number };
};

const { MAPBOX_ACCESS_TOKEN } = process.env;
const { GOONG_MAP_KEY } = process.env;

const MapViewComponent: React.FC<MapViewComponentProps> = ({ users, currentLoc }) => {
  const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAP_KEY}`
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [focusOnMe, setFocusOnMe] = useState(false);

  const focusLoc = () => {
    setFocusOnMe(!focusOnMe);
    if (focusOnMe && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
        zoomLevel: 14,
        animationDuration: 2000,
      });
    }
    console.log("Current Users: " + users.size); // ✅ This will now work
  };

  // Set Mapbox Access Token
  MapboxGL.setAccessToken(`${MAPBOX_ACCESS_TOKEN}`);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView styleURL={loadMap} ref={mapRef} style={styles.map}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={10}
          centerCoordinate={[currentLoc.longitude, currentLoc.latitude]}
        />
        {Array.from(users.values()).map((user) => (
          <UserMarker key={user.uuid} user={user} />
        ))}
      </MapboxGL.MapView>
      <View style={styles.bottom}>
        <TouchableOpacity onPress={focusLoc}>
          <LocateFixed color="#0080FF" size={28} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  bottom: {
    position: "absolute",
    bottom: hp("4%"),
    alignSelf: "center",
  },
});

export default MapViewComponent;
