// // import React, { useEffect, useRef, useState } from "react";
// // import MapboxGL from "@rnmapbox/maps";
// // import { View } from "react-native";
// // import { UserMarker } from "./UserMarker";
// // import MyLocationButton from "./MyLocationButton";
// // import { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";
// // import { User } from "../../app/context/formFields";

// // type Users = Map<string, User>;

// // const { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } = process.env;
// // const { EXPO_PUBLIC_GOONG_MAP_KEY } = process.env;

// // type MapViewComponentProps = {
// //   users: Users;
// //   currentLoc: { latitude: number; longitude: number };
// //   focusMode: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
// //   children?: React.ReactNode;
// //   isActionSheetOpen: boolean;
// //   // cameraRef: React.RefObject<MapboxGL.Camera>;
// //   role: "Driver" | "Customer";           // thêm
// //   driverHeading?: number;                // thêm
// //   // user: User;
// //   userId: string;
// // };

// // const MapViewComponent: React.FC<MapViewComponentProps> = ({
// //   users,
// //   currentLoc,
// //   focusMode: [focusOnMe, setFocusOnMe],
// //   children,
// //   role,
// //   userId,
// //   // driverHeading=0,
// //   // cameraRef,
// // }) => {
// //   const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${EXPO_PUBLIC_GOONG_MAP_KEY}`;
// //   const mapRef = useRef<MapboxGL.MapView>(null);
// //   const cameraRef = useRef<MapboxGL.Camera>(null);
// //   const [driverHeading, setDriverHeading] = useState(0);
// //   MapboxGL.setAccessToken(`${EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`);

// //   // useEffect(() => {
// //   //   if (focusOnMe && cameraRef.current) {
// //   //     cameraRef.current.setCamera({
// //   //       centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
// //   //       zoomLevel: 14,
// //   //       animationDuration: 1000,
// //   //     });
// //   //   }
// //   // }, [focusOnMe, currentLoc]);

// //   useEffect(() => {
// //     // setDriverHeading(user?.heading || 0);
// //     // setDriverHeading(user?.heading || 0);

// //     if (!cameraRef.current) return;

// //     if (role === "Customer") {
// //       // Top‑down 
// //       cameraRef.current.setCamera({
// //         centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
// //         zoomLevel: 14,
// //         pitch: 0,
// //         heading: 0,
// //         animationDuration: 1000,
// //       });
// //     } else {
// //       // 3rd‑person góc nghiêng + xoay theo heading
// //       cameraRef.current.setCamera({
// //         centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
// //         zoomLevel: 19,
// //         pitch: 60,                  // nghiêng 60 độ
// //         heading: user?.heading,     // xoay theo hướng
// //         animationMode: "easeTo",
// //         animationDuration: 1000,
// //         bounds: {
// //           ne: [currentLoc.longitude + 90000, currentLoc.latitude + 90000],
// //           sw: [currentLoc.longitude - 9, currentLoc.latitude - 9],
// //         }
// //       });
// //     }
// //   }, [focusOnMe, currentLoc, role, driverHeading]);
// //   const locationButtonOffset = useSharedValue(10);

// //   const animatedButtonStyle = useAnimatedStyle(() => ({
// //     bottom: locationButtonOffset.value,
// //   }));

// //   const user = users.get(userId);
// //   // console.log(driverHeading);
// //   console.log(user?.heading);
// //   return (
// //     <View className="flex-1">
// //       <MapboxGL.MapView styleURL={loadMap} ref={mapRef} style={{ flex: 1 }}logoEnabled={false} attributionEnabled={false} >
// //         {/* <MapboxGL.Camera ref={cameraRef} zoomLevel={14} /> */}
// //         {/* <MapboxGL.UserLocation
// //           //  visible
// //           visible={false}
// //           showsUserHeadingIndicator
// //           minDisplacement={1}
// //           onUpdate={(location) => {
// //             const heading = location.coords.heading;
// //             setDriverHeading((prevHeading) => heading ?? prevHeading); // provide the previous value if heading is undefined
// //           }}
// //         /> */}
// //         <MapboxGL.Camera
// //           ref={cameraRef}
// //           pitch={role === "Driver" ? 60 : 0}
// //           heading={role === "Driver" ? user?.heading : 0}
// //         />
// //         <MapboxGL.Camera ref={cameraRef} />
// //         {/* {cameraRef && <MapboxGL.Camera ref={cameraRef} />} */}
// //         {Array.from(users.entries()).map(([key, user]) => (
// //           <UserMarker key={key} user={user} heading={user.heading} />
// //         ))}
// //         {children}
// //       </MapboxGL.MapView>
// //       <MyLocationButton onPress={() => setFocusOnMe(!focusOnMe)} />
// //     </View>
// //   );
// // };

// // export default MapViewComponent;

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

// import React, { useEffect, useRef } from "react";
// import MapboxGL from "@rnmapbox/maps";
// import { View } from "react-native";
// import UserMarker from "./UserMarker";
// import MyLocationButton from "./MyLocationButton";
// import { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";
// import { User } from "../../app/context/formFields";

// type Users = Map<string, User>;

// const { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } = process.env;
// const { EXPO_PUBLIC_GOONG_MAP_KEY } = process.env;

// type MapViewComponentProps = {
//   users: Users;
//   currentLoc: { latitude: number; longitude: number };
//   focusMode: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
//   children?: React.ReactNode;
//   isActionSheetOpen: boolean;
// };

// const MapViewComponent: React.FC<MapViewComponentProps> = ({
//   users,
//   currentLoc,
//   focusMode: [focusOnMe, setFocusOnMe],
//   children,
// }) => {
//   const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${EXPO_PUBLIC_GOONG_MAP_KEY}`;
//   const mapRef = useRef<MapboxGL.MapView>(null);
//   const cameraRef = useRef<MapboxGL.Camera>(null);

//   MapboxGL.setAccessToken(`${EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`);

//   useEffect(() => {
//     if (focusOnMe && cameraRef.current) {
//       cameraRef.current.setCamera({
//         centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
//         zoomLevel: 14,
//         animationDuration: 1000,
//       });
//     }
//   }, [focusOnMe, currentLoc]);

//   const locationButtonOffset = useSharedValue(10);

//   const animatedButtonStyle = useAnimatedStyle(() => ({
//     bottom: locationButtonOffset.value,
//   }));

//   return (
//     <View className="flex-1">
//       <MapboxGL.MapView styleURL={loadMap} ref={mapRef} style={{ flex: 1 }} >
//         <MapboxGL.Camera ref={cameraRef} zoomLevel={14} />

//         {Array.from(users.entries()).map(([key, user]) => (
//           <UserMarker key={key} user={user} />
//         ))}
//         {children}
//       </MapboxGL.MapView>
//       <MyLocationButton onPress={() => setFocusOnMe(!focusOnMe)}  />
//     </View>
//   );
// };

// export default MapViewComponent;