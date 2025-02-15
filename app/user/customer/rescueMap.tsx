import React, { useState, useRef, useEffect } from "react";
import * as Location from "expo-location";
import { FlatList } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import polyline from "@mapbox/polyline"; // Thư viện giải mã polyline
import { SearchResult } from "@/app/context/formFields";

// Import các thành phần của Actionsheet và Button từ Gluestack UI
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";
import { Icon, LocateFixed } from "lucide-react-native";

// Set Mapbox Access Token
MapboxGL.setAccessToken(
  "pk.eyJ1IjoiaG9wZWFkbGVyIiwiYSI6ImNtNWF4azVlNjR1MGoyanEzdmx4cXJta2IifQ.2D3xCxaGst7iz9zxCwvAhg"
);

/**
 * Hàm giải mã polyline sử dụng thư viện @mapbox/polyline.
 * Lưu ý: polyline.decode trả về mảng các cặp [lat, lng] nên cần đảo ngược thành [lng, lat] cho MapboxGL.
 */
function decodePolyline(encoded: string): [number, number][] {
  return polyline.decode(encoded).map(([lat, lng]: [number, number]) => [lng, lat]);
}

const RescueMapScreen = () => {
  // URL bản đồ từ goong.io với key đã thay
  const [loadMap] = useState(
    "https://tiles.goong.io/assets/goong_map_web.json?api_key=kxqBgWA65Rq2Z0K85ZUUFgksN2liNnqprw9BY6DE"
  );

  // Tọa độ cho origin và destination
  const [originCoordinates, setOriginCoordinates] = useState<[number, number]>([106.701054, 10.776553]);
  const [destinationCoordinates, setDestinationCoordinates] = useState<[number, number] | null>(null);
  // State cho input text
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");

  // State lưu kết quả autocomplete
  const [originResults, setOriginResults] = useState<SearchResult[]>([]);
  const [destinationResults, setDestinationResults] = useState<SearchResult[]>([]);

  // State lưu polyline tuyến đường (mảng tọa độ sau khi giải mã)
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  // State lưu thông tin chi tiết chuyến đi (distance, duration, …) từ API Goong
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);

  // State lưu cước phí (fare) trả về từ API tính tiền và trạng thái loading của nó
  const [fare, setFare] = useState<number | null>(null);
  const [fareLoading, setFareLoading] = useState<boolean>(false);

  // Flags đánh dấu đã chọn điểm đi và điểm đến
  const [originSelected, setOriginSelected] = useState(false);
  const [destinationSelected, setDestinationSelected] = useState(false);

  // State điều khiển hiển thị Actionsheet
  const [showActionsheet, setShowActionsheet] = useState(false);

  const camera = useRef<MapboxGL.Camera>(null);

  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    const { longitude, latitude } = location.coords;
    setOriginCoordinates([longitude, latitude]);
    camera.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 12,
      animationDuration: 2000,
    });
  };
  useEffect(() => {
    MapboxGL.setTelemetryEnabled(false);
    requestLocationPermission();
  }, []);

  // Hàm gọi API Geocode của Goong để lấy tọa độ từ địa chỉ
  const fetchLocationFromGeocoding = async (address: string, isOrigin: boolean) => {
    try {
      const response = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(
          address
        )}&api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        if (isOrigin) {
          setOriginCoordinates([lng, lat]);
          setOriginResults([]);
          setOriginSelected(true);
          camera.current?.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: 16,
            animationDuration: 1000,
          });
        } else {
          setDestinationCoordinates([lng, lat]);
          setDestinationResults([]);
          setDestinationSelected(true);
          camera.current?.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: 16,
            animationDuration: 1000,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching geocode location:", error);
    }
  };

  // Hàm tìm kiếm autocomplete cho origin
  const searchOriginLocation = async () => {
    if (originQuery.trim() === "") {
      setOriginResults([]);
      return;
    }
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv&input=${originQuery}`
      );
      const data = await response.json();
      setOriginResults(data.predictions || []);
    } catch (error) {
      console.error("Error fetching origin search results:", error);
    }
  };

  // Hàm tìm kiếm autocomplete cho destination
  const searchDestinationLocation = async () => {
    if (destinationQuery.trim() === "") {
      setDestinationResults([]);
      return;
    }
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv&input=${destinationQuery}`
      );
      const data = await response.json();
      setDestinationResults(data.predictions || []);
    } catch (error) {
      console.error("Error fetching destination search results:", error);
    }
  };

  // Debounce cho input: chờ 500ms sau khi người dùng nhập
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchOriginLocation();
    }, 500);
    return () => clearTimeout(timeout);
  }, [originQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchDestinationLocation();
    }, 500);
    return () => clearTimeout(timeout);
  }, [destinationQuery]);

  //Đổi lng&lat của origin thành địa chỉ gắn lên input
  const getStringedLocation = async () => {
    try {
      requestLocationPermission();
      const coords = originCoordinates;
      const response = await fetch(
        `https://rsapi.goong.io/geocode?latlng=${coords[1]}%2C${coords[0]}&api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv`
      );
      const data = await response.json();
      console.log(data.results[0].formatted_address);
      setOriginQuery(data.results[0].formatted_address);
    } catch (error) {
      console.error("Error getting stringed Location:", error);
    }
  }
  // Hàm gọi API Directions của Goong để lấy tuyến đường (xe tải mặc định)
  const fetchDirections = async () => {
    if (!destinationCoordinates) return;
    const originStr = `${originCoordinates[1]},${originCoordinates[0]}`;
    const destinationStr = `${destinationCoordinates[1]},${destinationCoordinates[0]}`;
    try {
      const response = await fetch(
        `https://rsapi.goong.io/direction?origin=${originStr}&destination=${destinationStr}&vehicle=truck&api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const encodedPolyline = data.routes[0].overview_polyline.points;
        const decoded = decodePolyline(encodedPolyline);
        setRouteCoordinates(decoded);
        console.log("Decoded polyline:", decoded);
        if (data.routes[0].legs && data.routes[0].legs.length > 0) {
          setDirectionsInfo(data.routes[0].legs[0]);
        }
      } else {
        console.log("No routes found in response:", data);
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  };

  // Khi destinationCoordinates thay đổi, gọi fetchDirections để lấy tuyến đường
  useEffect(() => {
    if (destinationCoordinates) {
      fetchDirections();
    }
  }, [destinationCoordinates]);

  // Khi directionsInfo có dữ liệu, tự động mở Actionsheet và gọi API tính tiền
  useEffect(() => {
    if (directionsInfo) {
      setShowActionsheet(true);
      // Gọi API tính tiền với giá trị distance trả về từ Goong (không chuyển đổi)
      const distanceValue = directionsInfo.distance?.value || 0;
      setFareLoading(true);
      fetch(`https://motor-save-be.vercel.app/api/v1/distance/calculate?distance=${distanceValue}`)
        .then((res) => res.json())
        .then((data) => {
          setFare(data.totalMoney);
          setFareLoading(false);
        })
        .catch((error) => {
          console.error("Error calculating fare:", error);
          setFareLoading(false);
        });
    }
  }, [directionsInfo]);

  return (
    <Box className="flex-1">
      {/* Container chứa các input (hiển thị trên đầu map) */}
      <Box className="absolute top-0 left-0 w-full z-10 p-4">
        {/* Input điểm đi */}
        <Input variant="outline" size="md" className="bg-white">
          <InputField
            placeholder="Search origin"
            defaultValue={originQuery}
            value={originQuery}
            onChangeText={setOriginQuery}
          />
          <Button variant="solid" size="sm" onPress={() => getStringedLocation()}>
            <LocateFixed color="#8b5cf6" />
          </Button>
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
                  fetchLocationFromGeocoding(item.description, true);
                }}
                className="p-2"
              >
                <Text className="text-black">{item.description}</Text>
              </Pressable>
            )}
          />
        )}

        {/* Input điểm đến: chỉ cho phép nhập khi đã chọn điểm đi */}
        <Box className="mt-2">
          <Input variant="outline" size="md" className="bg-white" isDisabled={!originSelected}>
            <InputField
              placeholder="Search destination"
              value={destinationQuery}
              onChangeText={setDestinationQuery}
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
                  fetchLocationFromGeocoding(item.description, false);
                }}
                className="p-2"
              >
                <Text className="text-black">{item.description}</Text>
              </Pressable>
            )}
          />
        )}
      </Box>

      {/* Container bản đồ chiếm toàn bộ màn hình */}
      <Box className="flex-1">
        <MapboxGL.MapView
          styleURL={loadMap}
          style={{ flex: 1 }}
          projection="globe"
          zoomEnabled={true}
        >
          <MapboxGL.Camera
            ref={camera}
            zoomLevel={12}
            centerCoordinate={originCoordinates}
          />
          <MapboxGL.PointAnnotation id="origin-marker" coordinate={originCoordinates}>
            <MapboxGL.Callout title="Origin" />
          </MapboxGL.PointAnnotation>
          {destinationCoordinates && (
            <MapboxGL.PointAnnotation id="destination-marker" coordinate={destinationCoordinates}>
              <MapboxGL.Callout title="Destination" />
            </MapboxGL.PointAnnotation>
          )}
          {/* Vẽ tuyến đường nếu có polyline giải mã */}
          {routeCoordinates.length > 0 && (
            <MapboxGL.ShapeSource
              id="routeSource"
              shape={{
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: routeCoordinates,
                },
                properties: {},
              }}
            >
              <MapboxGL.LineLayer
                id="routeLine"
                style={{
                  lineColor: "#ff0000",
                  lineWidth: 4,
                }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>
      </Box>

      {/* Actionsheet hiển thị thông tin chuyến đi tự động mở */}
      <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="bg-white rounded-t-xl">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator className="bg-gray-300 rounded-full w-10 h-1 mx-auto my-2" />
          </ActionsheetDragIndicatorWrapper>
          <Box className="p-4">
            <Text className="text-xl font-bold text-center">Trip Details</Text>
            <Box className="mt-4">
              <Text className="text-md">Distance: {directionsInfo?.distance?.text}</Text>
              <Text className="text-md mt-2">Duration: {directionsInfo?.duration?.text}</Text>
              <Text className="text-md mt-2">
                {fareLoading
                  ? "Calculating fare..."
                  : fare !== null
                    ? `Fare: ${fare.toLocaleString()} VND`
                    : "Fare: N/A"}
              </Text>
            </Box>
            <Box className="mt-4">
              <Button onPress={() => setShowActionsheet(false)}>
                <ButtonText>Close</ButtonText>
              </Button>
            </Box>
          </Box>
        </ActionsheetContent>
      </Actionsheet>
    </Box>
  );
};

export default RescueMapScreen;
