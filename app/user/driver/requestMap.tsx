import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import MapboxGL from "@rnmapbox/maps";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";
// Import the ActionSheet components from gluestack-ui
import { getDirections } from "@/app/services/goongAPI";
import { getCurrentLocation, requestLocationPermission, watchLocation } from "@/app/utils/locationService";
import { hereNow, publishLocation, setupPubNub, subscribeToChannel } from "@/app/utils/pubnubService";
import { decodedToken, decodePolyline } from "@/app/utils/utils";
import MapViewComponent from "@/components/custom/MapViewComponent";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetSectionHeaderText,
} from "@/components/ui/actionsheet";
import { Switch } from "react-native";

const { PUBNUB_PUBLISH_KEY } = process.env;
const { PUBNUB_SUBSCRIBE_KEY } = process.env;

type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};

interface RequestDetail {
  fullname: string;
  phone: string;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  pickuplong: number;
  pickuplat: number;
  deslng: number;
  deslat: number;
}

interface DirectionsLeg {
  distance: { text: string };
  duration: { text: string };
}

type ProgressState = "Accepted" | "Picking Up" | "Processing" | "Done";

interface CameraOptions {
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  animationDuration?: number;
  bounds?: {
    ne: [number, number];
    sw: [number, number];
  };
}

interface ICamera {
  setCamera(options: CameraOptions): void;
}

const RequestMap: React.FC = () => {
  // Inline generic type for search params to satisfy the constraint.
  const { requestdetailid } = useLocalSearchParams<{ requestdetailid: string }>();
  const { user, token } = useContext(AuthContext);

  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });
  const [originCoordinates, setOriginCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [destinationCoordinates, setDestinationCoordinates] = useState({ latitude: 0, longitude: 0 });

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [directionsInfo, setDirectionsInfo] = useState<DirectionsLeg | null>(null);
  const [progress, setProgress] = useState<ProgressState>("Accepted");
  // State to control the open/close state of the ActionSheet.
  const [isActionSheetOpen, setIsActionSheetOpen] = useState<boolean>(true);

  const camera = useRef<ICamera | null>(null);

  //PUBNUB integration:
  const userId = decodedToken(token)?.id;
  const [users, setUsers] = useState(new Map<string, User>());
  const pubnub = setupPubNub(PUBNUB_PUBLISH_KEY || "", PUBNUB_SUBSCRIBE_KEY || "", userId || "");
  const [focusOnMe, setFocusOnMe] = useState<boolean>(false);
  const [hideUser, setHideUser] = useState<boolean>(false);
  //PUBNUB SERVICE
  const updateLocation = async (locationSubscription: any) => {
    if (await requestLocationPermission() && userId) {
      const location = await getCurrentLocation();
      setCurrentLoc(location.coords);
      publishLocation(pubnub, userId, user, location.coords.latitude, location.coords.longitude, hideUser);

      // Subscribe to live location updates
      locationSubscription = await watchLocation((position: any) => {
        setCurrentLoc(position.coords);
        publishLocation(pubnub, userId, user, position.coords.latitude, position.coords.longitude, hideUser);
      });
      console.log('Location updated')
    }
  };

  useEffect(() => {
    let locationSubscription: any;

    // Initial call
    updateLocation(locationSubscription);
    fetchRoute();
    // Set interval for 10s updates
    const intervalId = setInterval(updateLocation, 10000);
    return () => {
      clearInterval(intervalId);
      if (locationSubscription) locationSubscription.remove(); // Cleanup
    };
  }, []);


  useEffect(() => {
    subscribeToChannel(pubnub, user, (msg: any) => {
      const message = msg.message;
      //Only take current user
      if (msg.publisher === userId && message.isHidden === false)
        setUsers((prev) => new Map(prev).set(msg.publisher, message));
    });


    return () => pubnub.unsubscribeAll();
  }, []);

  useEffect(() => {
    hereNow(pubnub)
  }, [])

  const changeProgressState = () => {
    switch (progress) {
      case "Accepted":
        setProgress("Picking Up");
        break;
      case "Picking Up":
        setProgress("Processing");
        break;
      case "Processing":
        setProgress("Done");
        break;
      default:
        break;
    }
  };

  const resetProgress = () => {
    setProgress("Accepted");
  };

  const changeButtonColor = (): string => {
    switch (progress) {
      case "Accepted":
        return "bg-yellow-500";
      case "Picking Up":
        return "bg-blue-500";
      case "Processing":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const changeButtonTitle = (): string => {
    switch (progress) {
      case "Accepted":
        return "Đi đến điểm đón";
      case "Picking Up":
        return "Tiến hành chở khách";
      case "Processing":
        return "Trả khách";
      default:
        return "";
    }
  };

  useEffect(() => {
    console.log(progress);
  }, [progress]);

  useEffect(() => {
    const fetchRequestDetail = async () => {
      try {
        const response = await axios.get<RequestDetail>(
          `https://motor-save-be.vercel.app/api/v1/requests/driver/${requestdetailid}`,
          { headers: { Authorization: "Bearer " + token } }
        );
        setRequestDetail(response.data);
        setOriginCoordinates({
          latitude: response.data.pickuplat,
          longitude: response.data.pickuplong,
        });
        setDestinationCoordinates({
          latitude: response.data.deslat,
          longitude: response.data.deslng,
        });
      } catch (error) {
        console.error("Error fetching request details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetail();
  }, [requestdetailid, token]);



  const fetchRoute = () => {
    const currentLocStr = `${currentLoc.latitude},${currentLoc.longitude}`;
    const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
    const destinationStr = `${destinationCoordinates.latitude},${destinationCoordinates.longitude}`;
    let startStr = "";
    let endStr = "";

    switch (progress) {
      case "Accepted":
        startStr = originStr;
        endStr = destinationStr;
        break; // ✅ Use break instead of return
      case "Picking Up":
        startStr = currentLocStr;
        endStr = originStr;
        break; // ✅ Use break instead of return
      case "Processing":
        startStr = currentLocStr;
        endStr = destinationStr;
        break; // ✅ Use break instead of return
      default:
        console.warn("Unknown progress state:", progress);
        return; // Keep return only if progress is unknown
    }

    getDirections(startStr, endStr)
      .then((data: any) => {
        if (data.routes && data.routes.length > 0) {
          const encodedPolyline = data.routes[0].overview_polyline.points;
          const decoded = decodePolyline(encodedPolyline);
          setRouteCoordinates(decoded);
          if (data.routes[0].legs && data.routes[0].legs.length > 0) {
            setDirectionsInfo(data.routes[0].legs[0]);
            console.log("Switching route...");
          }
        } else {
          console.log("No routes found:", data);
        }
      })
      .catch((error: any) =>
        console.error("Error fetching directions:", error)
      );
  };

  useEffect(() => {
    fetchRoute();
  }, [currentLoc, progress])

  useEffect(() => {
    if (routeCoordinates.length > 0 && camera.current) {
      const lats = routeCoordinates.map((coord) => coord[1]);
      const lngs = routeCoordinates.map((coord) => coord[0]);
      const bounds = {
        ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
        sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
      };
      camera.current.setCamera({
        bounds,
        zoomLevel: 16,
        animationDuration: 1000,
      });
    }
  }, [routeCoordinates]);

  return (
    <Box className="flex-1">
      <MapViewComponent users={users} currentLoc={focusOnMe ? currentLoc : originCoordinates} focusMode={[focusOnMe, setFocusOnMe]} isActionSheetOpen={isActionSheetOpen}>
        {/* <View className="top-[25%] flex-row justify-between items-center mx-[2%]">
          <View className="flex-row justify-end items-center">
            <Switch
              value={hideUser}
              className="absolute left-[300px]"
              onValueChange={() => setHideUser(!hideUser)}
            />
          </View>
        </View> */}
        {originCoordinates && (
          <MapboxGL.PointAnnotation id="ori-marker" coordinate={[originCoordinates.longitude, originCoordinates.latitude]}>
            <MapboxGL.Callout title="Origin" />
          </MapboxGL.PointAnnotation>
        )}
        {destinationCoordinates && (
          <MapboxGL.PointAnnotation id="destination-marker" coordinate={[destinationCoordinates.longitude, destinationCoordinates.latitude]}>
            <MapboxGL.Callout title="Destination" />
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
              style={{ lineColor: "#007AFF", lineWidth: 4 }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapViewComponent>

      {/* ActionSheet from gluestack-ui for the request details */}
      <Actionsheet isOpen={isActionSheetOpen} onClose={() => setIsActionSheetOpen(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator className="bg-gray-300 rounded-full w-10 h-1 mx-auto my-2" />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetSectionHeaderText>
            <Text className="text-lg font-bold">Request Details</Text>
          </ActionsheetSectionHeaderText>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <View className="space-y-2">
              <Text className="text-lg font-bold">
                Full name: {requestDetail?.fullname}
              </Text>
              <Text className="text-gray-600">
                📞 Phone: {requestDetail?.phone}
              </Text>
              <Text className="text-gray-700">
                📍 Xuất phát ở: {requestDetail?.pickuplocation}
              </Text>
              <Text className="text-gray-700">
                📍 Kết thúc tại: {requestDetail?.destination}
              </Text>
              <Text className="text-gray-700">
                Distance: {directionsInfo?.distance?.text}
              </Text>
              <Text className="text-gray-700">
                Duration: {directionsInfo?.duration?.text}
              </Text>
              <Text className="text-green-600 font-semibold">
                💰 Tổng tiền: {requestDetail?.totalprice.toLocaleString()} VND
              </Text>
            </View>
          )}
        </ActionsheetContent>
      </Actionsheet>

      {/* Button to open the ActionSheet when it's closed */}
      {/* {!isActionSheetOpen && ( */}
      <TouchableOpacity
        onPress={() => setIsActionSheetOpen(true)}
        className="absolute bottom-24 left-5 bg-white p-2 rounded-2xl shadow-lg"
      >
        <Icon name="chevron-up" size={24} color="#000" />
      </TouchableOpacity>
      {/* )} */}

      {/* Buttons Container – fixed at the bottom */}
      <View
        className="absolute bottom-5 left-0 right-0 flex flex-row justify-around"
      >
        <Button
          className={`${changeButtonColor()} p-2 rounded`}
          size="lg"
          onPress={changeProgressState}
        >
          <Text className="text-white text-center">
            {changeButtonTitle()}
          </Text>
        </Button>
        <Button
          className="bg-green-500 p-2 rounded"
          size="lg"
          onPress={resetProgress}
        >
          <Text className="text-white text-center">Reset Progress</Text>
        </Button>
      </View>
    </Box>
  );
};

export default RequestMap;
