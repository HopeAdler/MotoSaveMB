import { Actionsheet, ActionsheetContent } from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import MapboxGL from "@rnmapbox/maps";
import { router } from "expo-router";
import { CircleChevronDown, LocateFixed } from "lucide-react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FlatList, NativeEventEmitter, NativeModules, View } from "react-native";

// Reanimated
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Import AuthContext, axios, và các hàm API từ services
import { AuthContext } from "@/app/context/AuthContext";
import {
  calculateFare,
  createRescueRequest,
  createTransaction,
  RescueRequestPayload,
} from "@/app/services/beAPI";
import {
  geocodeAddress,
  getAutocomplete,
  getDirections,
  getReverseGeocode,
} from "@/app/services/goongAPI";
import { getCurrentLocation, requestLocationPermission, watchLocation } from "@/app/utils/locationService";
import {
  PayZaloEventData,
  processPayment
} from "@/app/utils/payment";
import { hereNow, publishLocation, setupPubNub, subscribeToChannel } from "@/app/utils/pubnubService";
import { decodedToken, decodePolyline } from "@/app/utils/utils";
import MapViewComponent from "@/components/custom/MapViewComponent";
import TrackingActionSheet from "@/components/custom/TrackingActionSheet";

const { MAPBOX_ACCESS_TOKEN } = process.env;
const { GOONG_MAP_KEY } = process.env;
const { PUBNUB_PUBLISH_KEY } = process.env;
const { PUBNUB_SUBSCRIBE_KEY } = process.env;

type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};

MapboxGL.setAccessToken(`${MAPBOX_ACCESS_TOKEN}`);

const RescueMapScreen = () => {
  const { user, token } = useContext(AuthContext);
  const { PayZaloBridge } = NativeModules;

  // --- STATE & REF ---
  const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAP_KEY}`;
  // console.log(loadMap)
  const userId = decodedToken(token)?.id;
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });
  const [focusOnMe, setFocusOnMe] = useState(true);
  const [originCoordinates, setOriginCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [destinationCoordinates, setDestinationCoordinates] = useState({ latitude: 0, longitude: 0 });
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


  // --- Geocoding & Autocomplete ---
  // Reverse geocode origin nếu query rỗng
  useEffect(() => {
    if (!originQuery && originCoordinates) {
      getReverseGeocode(originCoordinates.latitude, originCoordinates.longitude).then(
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
        setOriginCoordinates({ longitude: lng, latitude: lat });
        setOriginResults([]);
        setOriginSelected(true);
      } else {
        setDestinationCoordinates({ longitude: lng, latitude: lat });
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
            ? `${originCoordinates.latitude},${originCoordinates.longitude}`
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
            ? `${originCoordinates.latitude},${originCoordinates.longitude}`
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
      const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
      const destinationStr = `${destinationCoordinates.latitude},${destinationCoordinates.longitude}`;
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

  const transaction = (
    requestdetailid: string,
    zptransid: string,
    totalamount: number,
    paymentmethod: string
  ) => { };

  // --- Payment ---
  const handlePayment = async () => {
    if (!token) {
      console.error("User not authenticated");
      return;
    }
    setPaymentLoading(true);
    const payload: RescueRequestPayload = {
      pickuplong: originCoordinates.longitude,
      pickuplat: originCoordinates.latitude,
      deslng: destinationCoordinates.longitude,
      deslat: destinationCoordinates.latitude,
      pickuplocation: originQuery,
      destination: destinationQuery,
      totalprice: fare || 0,
    };

    try {
      const result = await createRescueRequest(payload, token);
      console.log(result);
      const requestDetailId = result.requestdetailid;
      setShowActionsheet(false);
      setShowTracking(true); // This should trigger the TrackingActionSheet
      // Step 2: Process payment
      processPayment(fare);
      // Step 3: Listen for payment result
      const payZaloBridgeEmitter = new NativeEventEmitter(PayZaloBridge);
      const subscription = payZaloBridgeEmitter.addListener(
        "EventPayZalo",
        async (data: PayZaloEventData) => {
          if (data.returnCode === "1") {
            console.log("Payment successful:", data);
            alert("Payment successful!");

            try {
              // Step 4: Create transaction after successful payment
              const transactionResponse = await createTransaction(
                {
                  requestdetailid: requestDetailId,
                  zptransid: data.transactionId || "", // ZaloPay transaction ID
                  totalamount: fare,
                  paymentmethod: "ZaloPay",
                  paymentstatus: "Success",
                },
                token // Authentication token
              );

              console.log("Transaction created:", transactionResponse);
            } catch (error) {
              console.error("Error creating transaction:", error);
            }

            router.navigate("/user/customer/rescueMap");
          } else {
            alert("Payment failed! Return code: " + data.returnCode);
            router.navigate("/user/customer/rescueMap");
          }

          // Step 5: Remove listener after execution
          subscription.remove();
        }
      );
    } catch (error) {
      console.error("Error during payment", error);
    } finally {
      setPaymentLoading(false);
    }
  };


  //PUBNUB integration:

  const [users, setUsers] = useState(new Map<string, User>());
  const pubnub = setupPubNub(PUBNUB_PUBLISH_KEY || "", PUBNUB_SUBSCRIBE_KEY || "", userId || "");


  //PUBNUB SERVICE
  const updateLocation = async (locationSubscription: any) => {
    if (await requestLocationPermission() && userId) {
      const location = await getCurrentLocation();
      setCurrentLoc(location.coords);
      setOriginCoordinates(location.coords)
      publishLocation(pubnub, userId, user, location.coords.latitude, location.coords.longitude);

      // Subscribe to live location updates
      locationSubscription = await watchLocation((position: any) => {
        setCurrentLoc(position.coords);
        publishLocation(pubnub, userId, user, position.coords.latitude, position.coords.longitude);
      });
      // console.log('Location updated')
    }
  };

  useEffect(() => {
    let locationSubscription: any;

    // Initial call
    updateLocation(locationSubscription);
    // Set interval for 10s updates
    setOriginCoordinates(currentLoc);
    const intervalId = setInterval(updateLocation, 10000);
    return () => {
      clearInterval(intervalId);
      if (locationSubscription) locationSubscription.remove(); // Cleanup
    };
  }, []);


  useEffect(() => {
    subscribeToChannel(pubnub, user, (msg: any) => {
      const data = msg.message;
      setUsers((prev) => new Map(prev).set(msg.publisher, data));
    });

    return () => pubnub.unsubscribeAll();
  }, []);

  useEffect(() => {
    hereNow(pubnub)
  }, [users])
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
        <MapViewComponent users={users} currentLoc={focusOnMe ? currentLoc : originCoordinates} focusMode={[focusOnMe, setFocusOnMe]}>
          {originCoordinates && (
            <MapboxGL.Camera
              ref={camera}
              zoomLevel={12}
              centerCoordinate={[originCoordinates.longitude, originCoordinates.latitude]}
            />
          )}
          {currentLoc && (
            <MapboxGL.PointAnnotation
              id="current-location"
              coordinate={[currentLoc.longitude, currentLoc.latitude]}
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
              coordinate={[originCoordinates.longitude, originCoordinates.latitude]}
            >
              <MapboxGL.Callout title="Origin" />
            </MapboxGL.PointAnnotation>
          )}
          {destinationCoordinates && (
            <MapboxGL.PointAnnotation
              id="destination-marker"
              coordinate={[destinationCoordinates.longitude, destinationCoordinates.latitude]}
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
        </MapViewComponent>
      </Box>


      {/* Actionsheet hiển thị thông tin chuyến đi & nút thanh toán */}
      {showActionsheet && (
        <Actionsheet isOpen={true} onClose={() => { }}>
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
                // disabled={fareLoading || paymentLoading || fare === null}
                >
                  {/* <ButtonText>
                    {paymentLoading ? "Processing..." : "Pay Now"}
                  </ButtonText> */}
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
      <View className="absolute top-[2%] flex flex-col items-end w-full px-[5%]">
        <Text>Số người online: {users.size}</Text>
      </View>
    </Box>
  );
};

export default RescueMapScreen;
