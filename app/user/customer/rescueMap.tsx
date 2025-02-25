import { Actionsheet, ActionsheetContent } from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import MapboxGL from "@rnmapbox/maps";
import { router } from "expo-router";
import { CircleChevronDown, LocateFixed, ChevronLeft } from "lucide-react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FlatList, NativeEventEmitter, NativeModules, View } from "react-native";
// Import context, services, utils, custom hooks, components
import { AuthContext } from "@/app/context/AuthContext";
import { useCameraZoom } from "@/app/hooks/useCameraZoom";
import {
  calculateFare,
  createRescueRequest,
  createTransaction,
  RescueRequestPayload,
  updateRequestStatus,
} from "@/app/services/beAPI";
import {
  geocodeAddress,
  getAutocomplete,
  getDirections,
  getReverseGeocode,
} from "@/app/services/goongAPI";
import { decodePolyline } from "@/app/utils/utils";
import { getDistance } from "geolib"; // <-- NEW: Import thư viện geolib

// import MyLocationButton from "@/components/custom/MyLocationButton";
import TrackingActionSheet from "@/components/custom/TrackingActionSheet";
import TripDetailsActionSheet from "@/components/custom/TripDetailsActionSheet";

// Các import liên quan đến PubNub và Payment (nếu cần)
import { getCurrentLocation, requestLocationPermission, watchLocation } from "@/app/utils/locationService";
import { PayZaloEventData, processPayment, refundTransaction } from "@/app/utils/payment";
import { hereNow, publishLocation, setupPubNub, subscribeToChannel } from "@/app/utils/pubnubService";
import { decodedToken } from "@/app/utils/utils";
import MapViewComponent from "../../../components/custom/MapViewComponent";
import { PUBNUB_PUBLISH_KEY, PUBNUB_SUBSCRIBE_KEY } from "../../constant/pubnub";
import { Payload } from "pubnub";

const { MAPBOX_ACCESS_TOKEN } = process.env;
MapboxGL.setAccessToken(`${MAPBOX_ACCESS_TOKEN}`);

type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};

// NEW: Định nghĩa hằng số bán kính
const INITIAL_RADIUS = 5000; // 5 km
const MAX_RADIUS = 15000;    // 15 km

const RescueMapScreen = () => {
  const { user, token } = useContext(AuthContext);
  const { PayZaloBridge } = NativeModules;
  const userId = decodedToken(token)?.id;

  // Các state cho origin, destination, route, fare, countdown, tracking, …  
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });
  const [originCoordinates, setOriginCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [destinationCoordinates, setDestinationCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [fareLoading, setFareLoading] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [originSelected, setOriginSelected] = useState(false);
  const [destinationSelected, setDestinationSelected] = useState(false);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [showCountdownSheet, setShowCountdownSheet] = useState(false);
  const [requestDetailId, setRequestDetailId] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [zpTransId, setZpTransId] = useState<string | null>(null);

  // --- PubNub Integration ---
  const [users, setUsers] = useState(new Map<string, User>());
  const pubnub = setupPubNub(userId || "");

  // Refs
  const camera = useRef<MapboxGL.Camera>(null);
  useCameraZoom(camera, routeCoordinates);

  // --- Geocoding & Autocomplete ---
  useEffect(() => {
    if (!originQuery && originCoordinates.latitude && originCoordinates.longitude) {
      getReverseGeocode(originCoordinates.latitude, originCoordinates.longitude).then((address) => {
        if (address) {
          setOriginQuery(address);
          setOriginSelected(true);
        }
      });
    }
  }, [originCoordinates]);

  const handleFetchLocation = async (address: string, isOrigin: boolean) => {
    const result = await geocodeAddress(address);
    if (result) {
      const { lat, lng } = result;
      if (isOrigin) {
        setOriginCoordinates({ latitude: lat, longitude: lng });
        setOriginResults([]);
        setOriginSelected(true);
      } else {
        setDestinationCoordinates({ latitude: lat, longitude: lng });
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
          originCoordinates.latitude && originCoordinates.longitude
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
          originCoordinates.latitude && originCoordinates.longitude
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
      originCoordinates.latitude &&
      destinationCoordinates.latitude
    ) {
      const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
      const destinationStr = `${destinationCoordinates.latitude},${destinationCoordinates.longitude}`;
      console.log("Calculating direction..");
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
  }, [originCoordinates, destinationCoordinates, originSelected, destinationSelected]);

  useEffect(() => {
    if (directionsInfo) {
      setShowActionsheet(true);
      const distanceValue = directionsInfo.distance?.value || 0;
      setFareLoading(true);
      calculateFare(distanceValue)
        .then((money) => {
          setFare(money);
          // console.log(money);
          setFareLoading(false);
        })
        .catch((error) => {
          console.error("Error calculating fare:", error);
          setFareLoading(false);
        });
    }
  }, [directionsInfo]);

  // --- Payment & Request ---
  const handleCreateRequest = async () => {
    if (!token) return;
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
      handleRequestSuccess(result.requestdetailid);
      setShowActionsheet(false);
      setShowCountdownSheet(true);
      setRequestDetailId(result.requestdetailid);
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  const handlePayment = async () => {
    if (!token) return;
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
      const reqId = result.requestdetailid;
      setShowActionsheet(false);
      processPayment(fare);
      handleRequestSuccess(reqId);
      // Lắng nghe sự kiện thanh toán từ PayZalo
      const payZaloEmitter = new NativeEventEmitter(PayZaloBridge);
      const subscription = payZaloEmitter.addListener("EventPayZalo", async (data: PayZaloEventData) => {
        if (data.returnCode === "1") {
          router.navigate("/user/customer/rescueMap");
          console.log("Payment successful:", data);
          setZpTransId(data.transactionId || null);
          try {
            const transactionResponse = await createTransaction(
              {
                requestdetailid: reqId,
                zptransid: data.transactionId || "",
                totalamount: fare,
                paymentmethod: "ZaloPay",
                paymentstatus: "Success",
              },
              token
            );
            console.log("Transaction created:", transactionResponse);
          } catch (error) {
            console.error("Error creating transaction:", error);
          }
          handleRequestSuccess(reqId);
        } else {
          router.navigate("/user/customer/rescueMap");
          alert("Payment failed! Return code: " + data.returnCode);
        }
        subscription.remove();
      });
    } catch (error) {
      console.error("Error during payment:", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  // --- Countdown ---
  const startCountdown = (requestId: any) => {
    setRequestDetailId(requestId);
    setShowCountdownSheet(true);
    setCountdown(10);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowCountdownSheet(false); // Auto-close after countdown
          setShowTracking(true); // Open tracking sheet
        }
        return prev - 1;
      });
    }, 1000);
  };

  // NEW: Hàm gửi yêu cầu cho các driver trong bán kính xác định sử dụng geolib
  const sendRideRequestToDrivers = (radius: number) => {
    // let radius = INITIAL_RADIUS
    // Sử dụng originCoordinates nếu có, nếu không thì dùng currentLoc
    const baseLocation =
      originCoordinates.latitude !== 0 && originCoordinates.longitude !== 0
        ? originCoordinates
        : currentLoc;

    const nearbyDrivers: (User & { distance: number })[] = [];
    users.forEach((userData) => {
      // Kiểm tra role (sau khi chuyển về lowercase)
      if (userData.role && userData.role.toLowerCase() === "driver") {
        const distance = getDistance(
          { latitude: baseLocation.latitude, longitude: baseLocation.longitude },
          { latitude: userData.latitude, longitude: userData.longitude }
        );
        console.log(`Driver ${userData.username} (${userData.uuid}) cách ${distance} mét`);
        if (distance <= radius) {
          nearbyDrivers.push({ ...userData, distance });
        }
      }
    });

    // Sắp xếp theo khoảng cách tăng dần
    nearbyDrivers.sort((a, b) => a.distance - b.distance);

    console.log(nearbyDrivers);
    if (nearbyDrivers.length > 0) {
      // Gửi yêu cầu đến từng driver (chuyển message thành string)
      nearbyDrivers.forEach((driver) => {
        //   pubnub.publish({
        //     channel: `global`,
        //     message: {
        //       type: "rideRequest",
        //       requestId: requestDetailId,
        //       customerId: userId,
        //       pickup: originCoordinates,
        //       destination: destinationCoordinates,
        //       fare: fare,
        //     } as Payload,
        //   });

        handleCreateRequest();
      });
      console.log(`Sent ride request to drivers within ${radius} meters: ${nearbyDrivers.map((d) => d.uuid)}`);
    } else {
      console.log(`No drivers found within ${radius} meters.`);
      const newRadius = radius + 2000; // Mở rộng bán kính thêm 2 km
      if (newRadius <= MAX_RADIUS) {
        setTimeout(() => {
          sendRideRequestToDrivers(newRadius);
        }, 10000);
      } else {
        alert("No drivers available nearby. Please try again later.");
      }
    }
  };

  // Sửa handleRequestSuccess để bắt đầu countdown và gửi yêu cầu đến driver
  const handleRequestSuccess = (reqId: string) => {
    startCountdown(reqId);
  };
  const handleFindDriver = () => {
    sendRideRequestToDrivers(INITIAL_RADIUS);
  };


  // --- handleCancel (lấy nguyên code của bạn) ---
  const handleCancel = async () => {
    if (!requestDetailId) return;
    try {
      // Update request status to "Cancel"
      const result = await updateRequestStatus(requestDetailId, token, "Cancel");
      console.log(result.message);
      alert("Request cancel");
      if (paymentMethod === "Zalopay") {
        await refundTransaction(zpTransId, "User canceled request", fare);
        const payZaloBridgeEmitter = new NativeEventEmitter(PayZaloBridge);
        const subscription = payZaloBridgeEmitter.addListener("EventPayZalo", async (data: PayZaloEventData) => {
          subscription.remove();
        });
      }
      setShowCountdownSheet(false);
    } catch (error) {
      console.error("Error canceling request:", error);
    }
  };

  // --- PubNub Integration ---

  const updateLocation = async (locationSubscription: any) => {
    if (await requestLocationPermission() && userId) {

      const location = await getCurrentLocation();
      if (!location?.coords) return;

      setCurrentLoc(location.coords);

      // Only update origin if it's still {0,0}
      setOriginCoordinates((prev) => {
        if (prev.latitude === 0 && prev.longitude === 0) {
          console.log("Origin reset", location.coords);
          return location.coords;
        }
        return prev; // Keep the existing value
      });

      // Publish location to PubNub
      publishLocation(pubnub, userId, user, location.coords.latitude, location.coords.longitude);

      // Subscribe to live location updates
      locationSubscription = await watchLocation((position: any) => {
        setCurrentLoc(position.coords);
        publishLocation(pubnub, userId, user, position.coords.latitude, position.coords.longitude);
      });
    }
  };

  useEffect(() => {
    let locationSubscription: any;
    updateLocation(locationSubscription);
    const intervalId = setInterval(updateLocation, 10000);
    return () => {
      clearInterval(intervalId);
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  useEffect(() => {
    subscribeToChannel(
      pubnub,
      user,
      (msg: any) => {
        const message = msg.message;
        // Only the customer & all drivers
        if (msg.publisher === userId || message.role === 'Driver') {
          setUsers((prev) => new Map(prev).set(msg.publisher, msg.message));
        }
      },
      (event: any) => {
        // Handle presence events
        console.log(event)
        if (event.action === "leave" || event.action === "timeout") {
          // Remove user when they disconnect
          setUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(event.uuid);
            return updated;
          });
        }
      }
    );

    return () => {
      pubnub.unsubscribeAll();
      pubnub.destroy(); // Ensure the client fully stops sending heartbeats
    };
  }, []);

  useEffect(() => {
    hereNow(pubnub)
  }, [])
  return (
    <Box className="flex-1">
      <Box className="absolute top-4 left-4 z-20">
        <Pressable 
          onPress={() => router.navigate("/user/customer/servicePackage")}
          className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
      </Box>

      <Box className="absolute top-0 left-0 w-full z-10 p-4 pt-16">
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
            keyExtractor={(_item, index) => index.toString()}
            className="bg-white rounded max-h-40"
            renderItem={({ item }) => (
              <Pressable onPress={() => { setOriginQuery(item.description); handleFetchLocation(item.description, true); }} className="p-2">
                <Text className="text-black">{item.description}</Text>
              </Pressable>
            )}
          />
        )}
        <Box className="mt-2">
          <Input variant="outline" size="md" className="bg-white" isDisabled={!originSelected}>
            <InputField placeholder="Search destination" value={destinationQuery} onChangeText={handleDestinationChange} />
          </Input>
        </Box>
        {destinationResults.length > 0 && !destinationSelected && (
          <FlatList
            data={destinationResults}
            keyExtractor={(_item, index) => index.toString()}
            className="bg-white rounded max-h-40"
            renderItem={({ item }) => (
              <Pressable onPress={() => { setDestinationQuery(item.description); handleFetchLocation(item.description, false); }} className="p-2">
                <Text className="text-black">{item.description}</Text>
              </Pressable>
            )}
          />
        )}
      </Box>

      {/* Map Component */}
      <Box className="flex-1">
        <MapViewComponent users={users} currentLoc={currentLoc} isActionSheetOpen={showActionsheet} focusMode={[true, () => { }]}>
          {originCoordinates.latitude !== 0 && (
            <MapboxGL.Camera ref={camera} zoomLevel={12} centerCoordinate={[originCoordinates.longitude, originCoordinates.latitude]} />
          )}
          {currentLoc.latitude !== 0 && (
            <MapboxGL.PointAnnotation id="current-location" coordinate={[currentLoc.longitude, currentLoc.latitude]}>
              <Box style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                <LocateFixed color="#0080FF" size={28} />
              </Box>
            </MapboxGL.PointAnnotation>
          )}
          {originCoordinates.latitude !== 0 && (
            <MapboxGL.PointAnnotation id="origin-marker" coordinate={[originCoordinates.longitude, originCoordinates.latitude]}>
              <MapboxGL.Callout title="Origin" />
            </MapboxGL.PointAnnotation>
          )}
          {destinationCoordinates.latitude !== 0 && (
            <MapboxGL.PointAnnotation id="destination-marker" coordinate={[destinationCoordinates.longitude, destinationCoordinates.latitude]}>
              <Box className="w-40 h-40 items-center relative z-10 -bottom-1 border-red-400 border-2">
                <CircleChevronDown color="#0080FF" size={30} />
              </Box>
            </MapboxGL.PointAnnotation>
          )}
          {routeCoordinates.length > 0 && (
            <MapboxGL.ShapeSource
              id="routeSource"
              shape={{ type: "Feature", geometry: { type: "LineString", coordinates: routeCoordinates }, properties: {} }}
            >
              <MapboxGL.LineLayer id="routeLine" style={{ lineColor: "#ff0000", lineWidth: 4 }} />
            </MapboxGL.ShapeSource>
          )}
        </MapViewComponent>
      </Box>

      {/* Trip Details & Payment ActionSheet */}
      {showActionsheet && (
        <TripDetailsActionSheet
          isOpen={showActionsheet}
          onPayment={paymentMethod === "Tiền mặt" ? handleFindDriver : handlePayment}
          fare={fare}
          fareLoading={fareLoading}
          paymentLoading={paymentLoading}
          directionsInfo={directionsInfo}
          paymentMethodState={[paymentMethod, setPaymentMethod]}
        />
      )}

      {/* Countdown ActionSheet */}
      {showCountdownSheet && (
        <Actionsheet isOpen={showCountdownSheet} onClose={() => setShowCountdownSheet(false)}>
          <ActionsheetContent className="bg-white rounded-t-xl">
            <Box className="p-4">
              <Text className="text-xl font-bold text-center">Processing Request...</Text>
              <Text className="text-md text-center mt-2">Cancel within {countdown} seconds</Text>
              <Box className="mt-4">
                <Button variant="outline" size="lg" onPress={handleCancel}>
                  <ButtonText>Cancel Request</ButtonText>
                </Button>
              </Box>
            </Box>
          </ActionsheetContent>
        </Actionsheet>
      )}

      {/* Tracking ActionSheet */}
      {showTracking && (
        <TrackingActionSheet
          isOpen={showTracking}
          onClose={() => setShowTracking(false)}
          requestdetailid={requestDetailId}
          eta={directionsInfo?.distance?.text}
          distance={directionsInfo?.duration?.text}
        />
      )}

      {/* PubNub Info */}
      <View className="absolute top-[15%] flex flex-col items-end w-full px-[5%] z-20">
        <Text>Số người online: {users.size}</Text>
      </View>
    </Box>
  );
};

export default RescueMapScreen;
