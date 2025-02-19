import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import MapboxGL from "@rnmapbox/maps";
import { Box } from "@/components/ui/box";
import axios from "axios";
import { ActivityIndicator, View } from "react-native";
import { Text } from "@/components/ui/text";
import { AuthContext } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import * as Location from "expo-location";
import {
  getDirections,
} from "@/app/services/goongAPI";
import { decodePolyline } from "@/app/utils/utils";

const { MAPBOX_ACCESS_TOKEN } = process.env;
const { GOONG_MAP_KEY } = process.env;

MapboxGL.setAccessToken(`${MAPBOX_ACCESS_TOKEN}`);

const requestMap = () => {
  const { token } = useContext(AuthContext);
  const { requestdetailid } = useLocalSearchParams();
  const loadMap = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAP_KEY}`;
  const [requestDetail, setRequestDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [originCoordinates, setOriginCoordinates] = useState<[number, number] | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);

  const camera = useRef<MapboxGL.Camera>(null);

  useEffect(() => {
    const fetchRequestDetail = async () => {
      try {
        const response = await axios.get(
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
  }, [requestdetailid]);

  // --- LOCATION & PERMISSION ---
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
          const { longitude, latitude } = loc.coords;
        }
      );
      return () => subscription.remove();
    })();
  }, []);

  // --- Directions & Fare ---
  useEffect(() => {
    if (originCoordinates && destinationCoordinates) {
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
  }, [originCoordinates, destinationCoordinates]);

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
            ref={camera}
            zoomLevel={12}
            centerCoordinate={originCoordinates}
          />
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
      <Box className=" bg-white shadow-lg rounded-t-lg">
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <View className="space-y-2">
            <Text className="text-lg font-bold">
              Full name: {requestDetail.fullname}
            </Text>
            <Text className="text-gray-600">
              📞 Phone: {requestDetail.phone}
            </Text>
            <Text className="text-gray-700">
              📍 Pickup: {requestDetail.pickuplocation}
            </Text>
            <Text className="text-gray-700">
              📍 Destination: {requestDetail.destination}
            </Text>
            <Text className="text-gray-700">
              Distance: {directionsInfo?.distance?.text}
            </Text>
            <Text className="text-gray-700">
              Duration: {directionsInfo?.duration?.text}
            </Text>
            <Text className="text-green-600 font-semibold">
              💰 Total Price: {requestDetail.totalprice.toLocaleString()} VND
            </Text>
            <Button className="bg-green-500 p-2 rounded mt-2" size="lg">
              <Text className="text-white text-center">
                Get to pick up location
              </Text>
            </Button>
          </View>
        )}
      </Box>
    </Box>
  );
};

export default requestMap;
