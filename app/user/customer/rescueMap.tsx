import React, { useState, useRef, useEffect, useContext } from "react";
import * as Location from "expo-location";
import { FlatList } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Actionsheet, ActionsheetContent } from "@/components/ui/actionsheet";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { CircleChevronDown, LocateFixed } from "lucide-react-native";

// Reanimated
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

// Import AuthContext, axios, và các hàm API từ services
import { AuthContext } from "@/app/context/AuthContext";
import {
  getReverseGeocode,
  geocodeAddress,
  getAutocomplete,
  getDirections,
} from "@/app/services/goongAPI";
import {
  calculateFare,
  createRescueRequest,
  RescueRequestPayload,
} from "@/app/services/beAPI";
import { decodePolyline } from "@/app/utils/utils";
import TrackingActionSheet from "@/components/custom/TrackingActionSheet";

const { MAPBOX_ACCESS_TOKEN } = process.env;
const { GOONG_MAP_KEY } = process.env;
MapboxGL.setAccessToken(`${MAPBOX_ACCESS_TOKEN}`);

const RescueMapScreen = () => {
  const { token } = useContext(AuthContext);

  // --- STATE & REF ---
  const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAP_KEY}`;
  // console.log(loadMap)
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [originCoordinates, setOriginCoordinates] = useState<
    [number, number] | null
  >(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<
    [number, number] | null
  >(null);
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    []
  );
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [fareLoading, setFareLoading] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [originSelected, setOriginSelected] = useState(false);
  const [destinationSelected, setDestinationSelected] = useState(false);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [driverInfo, setDriverInfo] = useState({
    name: "SickMaDuck Driver",
    avatar: "https://pbs.twimg.com/media/GEXDdESbIAAd5Qt?format=jpg&name=large",
    vehicleInfo: "Honda Wave - 69K1-696969",
    eta: "10 mins",
    distance: "2.5 km",
    status: "arriving" as const,
  });
  const camera = useRef<MapboxGL.Camera>(null);

  // Reanimated: shared value cho nút "My Location"
  const locationButtonOffset = useSharedValue(10);
  useEffect(() => {
    locationButtonOffset.value = withTiming(showActionsheet ? 150 : 10, {
      duration: 300,
    });
  }, [showActionsheet]);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    bottom: locationButtonOffset.value,
  }));

  // --- LOCATION & PERMISSION ---
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const location = await Location.getCurrentPositionAsync({});
    const { longitude, latitude } = location.coords;
    const coords: [number, number] = [longitude, latitude];
    setCurrentLocation(coords);
    setOriginCoordinates(coords);
    camera.current?.setCamera({
      centerCoordinate: coords,
      zoomLevel: 12,
      animationDuration: 2000,
    });
  };

  useEffect(() => {
    (async () => {
      await requestLocationPermission();
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc) => {
          const { longitude, latitude } = loc.coords;
          setCurrentLocation([longitude, latitude]);
        }
      );
      return () => subscription.remove();
    })();
  }, []);

  // --- Geocoding & Autocomplete ---
  // Reverse geocode origin nếu query rỗng
  useEffect(() => {
    if (!originQuery && originCoordinates) {
      getReverseGeocode(originCoordinates[1], originCoordinates[0]).then(
        (address) => {
          if (address) {
            setOriginQuery(address);
            setOriginSelected(true);
          }
        }
      );
    }
  }, [originCoordinates]);

  const handleFetchLocation = async (address: string, isOrigin: boolean) => {
    const result = await geocodeAddress(address);
    if (result) {
      const { lat, lng } = result;
      if (isOrigin) {
        setOriginCoordinates([lng, lat]);
        setOriginResults([]);
        setOriginSelected(true);
      } else {
        setDestinationCoordinates([lng, lat]);
        setDestinationResults([]);
        setDestinationSelected(true);
      }
      camera.current?.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 16,
        animationDuration: 1000,
      });
    }
  };

  const handleOriginChange = (text: string) => {
    setOriginQuery(text);
    setOriginSelected(false);
  };

  const handleDestinationChange = (text: string) => {
    setDestinationQuery(text);
    setDestinationSelected(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (originQuery.trim()) {
        getAutocomplete(
          originQuery,
          originCoordinates
            ? `${originCoordinates[1]},${originCoordinates[0]}`
            : ""
        ).then(setOriginResults);
      } else {
        setOriginResults([]);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [originQuery, originCoordinates]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (destinationQuery.trim()) {
        getAutocomplete(
          destinationQuery,
          originCoordinates
            ? `${originCoordinates[1]},${originCoordinates[0]}`
            : ""
        ).then(setDestinationResults);
      } else {
        setDestinationResults([]);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [destinationQuery, originCoordinates]);

  // --- Directions & Fare ---
  useEffect(() => {
    if (
      originSelected &&
      destinationSelected &&
      originCoordinates &&
      destinationCoordinates
    ) {
      const originStr = `${originCoordinates[1]},${originCoordinates[0]}`;
      const destinationStr = `${destinationCoordinates[1]},${destinationCoordinates[0]}`;
      getDirections(originStr, destinationStr)
        .then((data) => {
          if (data.routes && data.routes.length > 0) {
            const encodedPolyline = data.routes[0].overview_polyline.points;
            const decoded = decodePolyline(encodedPolyline);
            setRouteCoordinates(decoded);
            if (data.routes[0].legs && data.routes[0].legs.length > 0) {
              setDirectionsInfo(data.routes[0].legs[0]);
            }
          } else {
            console.log("No routes found:", data);
          }
        })
        .catch((error) => console.error("Error fetching directions:", error));
    }
  }, [
    originCoordinates,
    destinationCoordinates,
    originSelected,
    destinationSelected,
  ]);

  // Zoom camera theo tuyến đường
  useEffect(() => {
    if (routeCoordinates.length > 0 && camera.current) {
      const lats = routeCoordinates.map((coord) => coord[1]);
      const lngs = routeCoordinates.map((coord) => coord[0]);
      const bounds = {
        ne: [Math.max(...lngs), Math.max(...lats)],
        sw: [Math.min(...lngs), Math.min(...lats)],
      };
      camera.current.setCamera({
        bounds,
        zoomLevel: 16,
        animationDuration: 1000,
      });
    }
  }, [routeCoordinates]);

  // --- Directions & Fare ---
  useEffect(() => {
    if (directionsInfo) {
      setShowActionsheet(true);
      const distanceValue = directionsInfo.distance?.value || 0;
      setFareLoading(true);
      // Sử dụng hàm calculateFare thay cho fetch trực tiếp
      calculateFare(distanceValue)
        .then((money: React.SetStateAction<number | null>) => {
          setFare(money);
          setFareLoading(false);
        })
        .catch((error: any) => {
          console.error("Error calculating fare:", error);
          setFareLoading(false);
        });
    }
  }, [directionsInfo]);

  // --- Payment ---
  const handlePayment = async () => {
    if (!token) {
      console.error("User not authenticated");
      return;
    }
    setPaymentLoading(true);
    const payload: RescueRequestPayload = {
      pickuplong: originCoordinates ? originCoordinates[0] : 0,
      pickuplat: originCoordinates ? originCoordinates[1] : 0,
      deslng: destinationCoordinates ? destinationCoordinates[0] : 0,
      deslat: destinationCoordinates ? destinationCoordinates[1] : 0,
      pickuplocation: originQuery,
      destination: destinationQuery,
      totalprice: fare || 0,
    };

    try {
      const result = await createRescueRequest(payload, token);
      console.log(result);
      setShowActionsheet(false);
      setShowTracking(true); // This should trigger the TrackingActionSheet
    } catch (error) {
      console.error("Error during payment", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation && camera.current) {
      camera.current.setCamera({
        centerCoordinate: currentLocation,
        zoomLevel: 16,
        animationDuration: 1000,
      });
    }
  };

  // --- RENDER ---
  return (
    <Box className="flex-1">
      {/* Container input (trên đầu map) */}
      <Box className="absolute top-0 left-0 w-full z-10 p-4">
        <Input variant="outline" size="md" className="bg-white">
          <InputField
            placeholder="Search origin"
            value={originQuery}
            onChangeText={handleOriginChange}
          />
        </Input>
        {originResults.length > 0 && !originSelected && (
          <FlatList
            data={originResults}
            keyExtractor={(item, index) => index.toString()}
            className="bg-white rounded max-h-40"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setOriginQuery(item.description);
                  handleFetchLocation(item.description, true);
                }}
                className="p-2"
              >
                <Text className="text-black">{item.description}</Text>
              </Pressable>
            )}
          />
        )}

        <Box className="mt-2">
          <Input
            variant="outline"
            size="md"
            className="bg-white"
            isDisabled={!originSelected}
          >
            <InputField
              placeholder="Search destination"
              value={destinationQuery}
              onChangeText={handleDestinationChange}
            />
          </Input>
        </Box>
        {destinationResults.length > 0 && !destinationSelected && (
          <FlatList
            data={destinationResults}
            keyExtractor={(item, index) => index.toString()}
            className="bg-white rounded max-h-40"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setDestinationQuery(item.description);
                  handleFetchLocation(item.description, false);
                }}
                className="p-2"
              >
                <Text className="text-black">{item.description}</Text>
              </Pressable>
            )}
          />
        )}
      </Box>

      {/* Bản đồ */}
      <Box className="flex-1">
        <MapboxGL.MapView
          styleURL={loadMap}
          style={{ flex: 1 }}
          projection="globe"
          zoomEnabled={true}
        >
          {originCoordinates && (
            <MapboxGL.Camera
              ref={camera}
              zoomLevel={12}
              centerCoordinate={originCoordinates}
            />
          )}
          {currentLocation && (
            <MapboxGL.PointAnnotation
              id="current-location"
              coordinate={currentLocation}
            >
              <Box
                style={{
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocateFixed color="#0080FF" size={28} />
              </Box>
            </MapboxGL.PointAnnotation>
          )}
          {originCoordinates && (
            <MapboxGL.PointAnnotation
              id="origin-marker"
              coordinate={originCoordinates}
            >
              <MapboxGL.Callout title="Origin" />
            </MapboxGL.PointAnnotation>
          )}
          {destinationCoordinates && (
            <MapboxGL.PointAnnotation
              id="destination-marker"
              coordinate={destinationCoordinates}
            >
              <Box className="w-40 h-40 items-center relative z-10 -bottom-1 border-red-400 border-2">
                <CircleChevronDown color="#0080FF" size={30} />
              </Box>
            </MapboxGL.PointAnnotation>
          )}
          {routeCoordinates.length > 0 && (
            <MapboxGL.ShapeSource
              id="routeSource"
              shape={{
                type: "Feature",
                geometry: { type: "LineString", coordinates: routeCoordinates },
                properties: {},
              }}
            >
              <MapboxGL.LineLayer
                id="routeLine"
                style={{ lineColor: "#ff0000", lineWidth: 4 }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>
      </Box>

      {/* Nút "My Location" với vị trí animate */}
      {currentLocation && (
        <Animated.View
          style={[
            { position: "absolute", right: 5, zIndex: 20 },
            animatedButtonStyle,
          ]}
        >
          <Button
            variant="solid"
            size="lg"
            className="rounded-full p-3.5"
            onPress={centerOnCurrentLocation}
          >
            <ButtonIcon as={LocateFixed} />
          </Button>
        </Animated.View>
      )}

      {/* Actionsheet hiển thị thông tin chuyến đi & nút thanh toán */}
      {showActionsheet && (
        <Actionsheet isOpen={true} onClose={() => {}}>
          <ActionsheetContent className="bg-white rounded-t-xl">
            <Box className="p-4">
              <Text className="text-xl font-bold text-center">
                Trip Details
              </Text>
              <Box className="mt-4">
                <Text className="text-md">
                  Distance: {directionsInfo?.distance?.text}
                </Text>
                <Text className="text-md mt-2">
                  Duration: {directionsInfo?.duration?.text}
                </Text>
                <Text className="text-md mt-2">
                  {fareLoading
                    ? "Calculating fare..."
                    : fare !== null
                      ? `Fare: ${fare.toLocaleString()} VND`
                      : "Fare: N/A"}
                </Text>
              </Box>
              <Box className="mt-4">
                <Button
                  variant="solid"
                  size="lg"
                  onPress={handlePayment}
                  disabled={fareLoading || paymentLoading || fare === null}
                >
                  <ButtonText>
                    {paymentLoading ? "Processing..." : "Pay Now"}
                  </ButtonText>
                </Button>
              </Box>
            </Box>
          </ActionsheetContent>
        </Actionsheet>
      )}

      {/* Actionsheet hiển thị thông tin của rescue driver */}
      {showTracking && (
        <TrackingActionSheet
          isOpen={showTracking}
          onClose={() => {
            setShowTracking(false);
          }}
          driverName={driverInfo.name}
          driverAvatar={driverInfo.avatar}
          vehicleInfo={driverInfo.vehicleInfo}
          eta={driverInfo.eta}
          distance={driverInfo.distance}
          status={driverInfo.status}
        />
      )}
    </Box>
  );
};

export default RescueMapScreen;
