import React, { useEffect, useRef, useState } from "react";
import MapboxGL, { FillLayerStyle } from "@rnmapbox/maps";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { UserMarker } from "./UserMarker";
import MyLocationButton from "./MyLocationButton";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { User } from "../../app/context/formFields";
import { HStack } from "../ui/hstack";
import { useIsFocused } from "@react-navigation/native";
import { ChevronLeft, ChevronRight, View as ViewIcon } from "lucide-react-native";

type Users = Map<string, User>;

const { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } = process.env;
const { EXPO_PUBLIC_GOONG_MAP_KEY } = process.env;

type MapViewComponentProps = {
  users: Users;
  currentLoc: { latitude: number; longitude: number };
  focusMode: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  children?: React.ReactNode;
  isActionSheetOpen: boolean;
  role: "Driver" | "Customer";
  userId: string;
};

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  users,
  currentLoc,
  focusMode: [focusOnMe, setFocusOnMe],
  children,
  role,
  userId,
}) => {
  const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${EXPO_PUBLIC_GOONG_MAP_KEY}`;
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [is3DMode, setIs3DMode] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(100)).current;

  MapboxGL.setAccessToken(EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

  const toggleViewPanel = () => {
    const newShowToggle = !showToggle;
    setShowToggle(newShowToggle);
    
    // Animate the panel
    Animated.timing(slideAnim, {
      toValue: newShowToggle ? 0 : 100, // 0 = visible, 100 = hidden
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // 1) Chỉ center+zoom lần đầu khi map load xong
  const handleMapLoad = () => {
    if (!hasInitialized && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
        zoomLevel: 14,
        pitch: 0,
        heading: 0,
        animationDuration: 0,
      });
      setHasInitialized(true);
    }
  };

  const centerOnUser = () => {
    if (!cameraRef.current) return;
    if (!is3DMode) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
        zoomLevel: 14,
        animationMode: "easeTo",
        animationDuration: 500,
      });
    }
  };
  // Cập nhật camera khi focus, vị trí, chế độ hay heading thay đổi
  // useEffect(() => {
  //   if (!cameraRef.current) return;
  //   const user = users.get(userId);
  //   const heading = user?.heading ?? 0;

  //   if (role === "Customer" || (role === "Driver" && !is3DMode)) {
  //     // 2D mode: giữ nguyên zoom/center, chỉ reset pitch/heading
  //     cameraRef.current.setCamera({
  //       centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
  //       zoomLevel: 14,
  //       pitch: 0,
  //       heading: 0,
  //       animationDuration: 300,
  //     });
  //   } else {
  //     // 3D mode: chỉ update pitch/heading
  //     cameraRef.current.setCamera({
  //       centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
  //       zoomLevel: 19,
  //       pitch: 60,
  //       heading,
  //       animationMode: "easeTo",
  //       animationDuration: 500,
  //     });
  //   }
  // }, [role, is3DMode, currentLoc]);

  // const isFocused = useIsFocused();
  useEffect(() => {
    if (!cameraRef.current) return;
    const user = users.get(userId);
    const heading = user?.heading ?? 0;

    if (role === "Customer" || !is3DMode) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
        pitch: 0,
        bounds: {
          ne: [currentLoc.longitude + 0.01, currentLoc.latitude + 0.01],
          sw: [currentLoc.longitude - 0.01, currentLoc.latitude - 0.01],
          paddingBottom: 20,
          paddingTop: 20,
          paddingLeft: 20,
          paddingRight: 20,
        },
        heading: 0,
        animationDuration: 800,
        type: "CameraStop"
      });
    } else {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
        zoomLevel: 20,
        pitch: 60,
        heading,
        bounds: {
          ne: [currentLoc.longitude + 0.01, currentLoc.latitude + 0.01],
          sw: [currentLoc.longitude - 0.01, currentLoc.latitude - 0.01],
          paddingBottom: 200,
          paddingTop: 2000,
          paddingLeft: 20,
          paddingRight: 20,
        },
        animationMode: "easeTo",
        animationDuration: 800,
      });
    }
  }, [role, is3DMode, users, userId, currentLoc]);

return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView
        styleURL={loadMap}
        scrollEnabled={!is3DMode}
        zoomEnabled={!is3DMode}
        ref={mapRef}
        style={{ flex: 1 }}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={handleMapLoad}
        compassEnabled={true}
        compassViewMargins={{x: 0, y: 180}}
        scaleBarEnabled={false}
        rotateEnabled={!is3DMode}
        pitchEnabled={!is3DMode}
      >
        <MapboxGL.Camera ref={cameraRef} />
        {Array.from(users.entries()).map(([key, u]) => (
          <UserMarker
            key={key}
            user={u}
            // chỉ xoay icon khi ở 2D và là driver
            heading={!is3DMode && u.role === "Driver" ? u.heading : 0}
          />
        ))}
        {children}
      </MapboxGL.MapView>

      {/* MyLocationButton: luôn bật focus và center về user nếu đang 2D */}
      {!is3DMode && (
        <MyLocationButton
          onPress={() => {
            centerOnUser();
          }}
        />
      )}

      {/* Toggle 2D/3D chỉ dành cho Driver */}
      {role === "Driver" && (
        <>
          <Animated.View
            style={[
              styles.toggleContainer,
              {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: [0, 120] // Set tầm output cho switch
                    })
                  }
                ]
              }
            ]}
          >
            <Pressable
              onPress={toggleViewPanel}
              style={styles.toggleButton}
            >
              {showToggle ? (
                <ChevronRight size={24} color="#1a3148" />
              ) : (
                <ChevronLeft size={24} color="#1a3148" />
              )}
            </Pressable>
            
            <HStack space="xs" style={styles.switchContainer} className="items-center">
              <Text size="sm" className="mr-2 text-[#1a3148] font-medium">
                {is3DMode ? "3D View" : "2D View"}
              </Text>
              <Switch
                size="md"
                value={is3DMode}
                onValueChange={(val) => setIs3DMode(val)}
                thumbColor={is3DMode ? "#fab753" : "#3B82F6"}
                trackColor={{ true: "#fab75360", false: "#3B82F630" }}
              />
            </HStack>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    position: 'absolute',
    top: '15%',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ translateY: -20 }],
  },
  toggleButton: {
    backgroundColor: 'white',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    zIndex: 2,
  },
  switchContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 12,
    paddingLeft: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  }
});

export default MapViewComponent;