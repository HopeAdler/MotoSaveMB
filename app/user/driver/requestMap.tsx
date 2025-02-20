import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import MapboxGL from "@rnmapbox/maps";
import axios from "axios";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";
// Import the ActionSheet components from gluestack-ui
import { getDirections } from "@/app/services/goongAPI";
import { decodePolyline } from "@/app/utils/utils";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetSectionHeaderText,
} from "@/components/ui/actionsheet";

const { MAPBOX_ACCESS_TOKEN } = process.env;
const { GOONG_MAP_KEY } = process.env;

MapboxGL.setAccessToken(`${MAPBOX_ACCESS_TOKEN}`);

interface RequestDetail {
  fullname: string;
  phone: string;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  pickuplong: number;
  pickuplat: number;
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
  const { token } = useContext(AuthContext);
  const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAP_KEY}`;

  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [originCoordinates, setOriginCoordinates] = useState<[number, number] | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [directionsInfo, setDirectionsInfo] = useState<DirectionsLeg | null>(null);
  const [progress, setProgress] = useState<ProgressState>("Accepted");
  // State to control the open/close state of the ActionSheet.
  const [isActionSheetOpen, setIsActionSheetOpen] = useState<boolean>(false);

  const camera = useRef<ICamera | null>(null);

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
        setDestinationCoordinates([
          response.data.pickuplong,
          response.data.pickuplat,
        ]);
      } catch (error) {
        console.error("Error fetching request details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetail();
  }, [requestdetailid, token]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const location = await Location.getCurrentPositionAsync({});
    const { longitude, latitude } = location.coords;
    const coords: [number, number] = [longitude, latitude];
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
          // Optionally update state here.
          const { longitude, latitude } = loc.coords;
        }
      );
      return () => subscription.remove();
    })();
  }, []);

  useEffect(() => {
    if (originCoordinates && destinationCoordinates) {
      const originStr = `${originCoordinates[1]},${originCoordinates[0]}`;
      const destinationStr = `${destinationCoordinates[1]},${destinationCoordinates[0]}`;
      getDirections(originStr, destinationStr)
        .then((data: any) => {
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
        .catch((error: any) =>
          console.error("Error fetching directions:", error)
        );
    }
  }, [originCoordinates, destinationCoordinates]);

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
      <MapboxGL.MapView
        styleURL={loadMap}
        style={{ flex: 1 }}
        projection="globe"
        zoomEnabled={true}
      >
        {originCoordinates && (
          <MapboxGL.Camera
            ref={camera as any}
            zoomLevel={12}
            centerCoordinate={originCoordinates}
          />
        )}
        {originCoordinates && (
          <MapboxGL.PointAnnotation id="origin-marker" coordinate={originCoordinates}>
            <MapboxGL.Callout title="Origin" />
          </MapboxGL.PointAnnotation>
        )}
        {destinationCoordinates && (
          <MapboxGL.PointAnnotation id="destination-marker" coordinate={destinationCoordinates}>
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
      </MapboxGL.MapView>

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
                📍 Pickup: {requestDetail?.pickuplocation}
              </Text>
              <Text className="text-gray-700">
                📍 Destination: {requestDetail?.destination}
              </Text>
              <Text className="text-gray-700">
                Distance: {directionsInfo?.distance?.text}
              </Text>
              <Text className="text-gray-700">
                Duration: {directionsInfo?.duration?.text}
              </Text>
              <Text className="text-green-600 font-semibold">
                💰 Total Price: {requestDetail?.totalprice.toLocaleString()} VND
              </Text>
            </View>
          )}
        </ActionsheetContent>
      </Actionsheet>

      {/* Button to open the ActionSheet when it's closed */}
      {/* {!isActionSheetOpen && ( */}
      <TouchableOpacity
        onPress={() => setIsActionSheetOpen(true)}
        style={{
          position: "absolute",
          bottom: 100,
          left: 20,
          backgroundColor: "white",
          padding: 8,
          borderRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Icon name="chevron-up" size={24} color="#000" />
      </TouchableOpacity>
      {/* )} */}

      {/* Buttons Container – fixed at the bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "space-around",
        }}
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
