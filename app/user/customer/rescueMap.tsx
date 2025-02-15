
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

// Import Actionsheet và Button từ Gluestack UI
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";
import { CircleChevronDown, LocateFixed, MapPinHouse } from "lucide-react-native";

// Set Mapbox Access Token
MapboxGL.setAccessToken(
  "pk.eyJ1IjoiaG9wZWFkbGVyIiwiYSI6ImNtNWF4azVlNjR1MGoyanEzdmx4cXJta2IifQ.2D3xCxaGst7iz9zxCwvAhg"
);

/**
 * Giải mã polyline: chuyển chuỗi mã hóa thành mảng tọa độ theo định dạng [lng, lat]
 */
function decodePolyline(encoded: string): [number, number][] {
  return polyline.decode(encoded).map(([lat, lng]: [number, number]) => [lng, lat]);
}

const RescueMapScreen = () => {
  // URL bản đồ từ goong.io
  const [loadMap] = useState(
    "https://tiles.goong.io/assets/goong_map_web.json?api_key=kxqBgWA65Rq2Z0K85ZUUFgksN2liNnqprw9BY6DE"
  );

  // Tọa độ cho current location, origin và destination
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [originCoordinates, setOriginCoordinates] = useState<[number, number] | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<[number, number] | null>(null);

  // State cho input text
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");

  // State lưu kết quả autocomplete
  const [originResults, setOriginResults] = useState<SearchResult[]>([]);
  const [destinationResults, setDestinationResults] = useState<SearchResult[]>([]);

  // State lưu polyline tuyến đường (mảng tọa độ sau khi giải mã)
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  // Thông tin chuyến đi từ API Goong (distance, duration, …)
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);

  // Cước phí (fare) và trạng thái loading của API tính tiền
  const [fare, setFare] = useState<number | null>(null);
  const [fareLoading, setFareLoading] = useState<boolean>(false);

  // Flags đánh dấu đã chọn địa chỉ (chỉ khi người dùng chọn gợi ý)
  const [originSelected, setOriginSelected] = useState(false);
  const [destinationSelected, setDestinationSelected] = useState(false);

  // State điều khiển hiển thị Actionsheet (luôn mở khi có directionsInfo)
  const [showActionsheet, setShowActionsheet] = useState(false);

  const camera = useRef<MapboxGL.Camera>(null);

  // Yêu cầu quyền truy cập vị trí và cập nhật currentLocation & originCoordinates
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
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

  // Theo dõi vị trí hiện tại liên tục
  useEffect(() => {
    (async () => {
      await requestLocationPermission();
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => {
          const { longitude, latitude } = loc.coords;
          const coords: [number, number] = [longitude, latitude];
          setCurrentLocation(coords);
        }
      );
      return () => subscription.remove();
    })();
  }, []);

  // Lấy địa chỉ chi tiết từ originCoordinates nếu originQuery đang rỗng
  const getStringedLocation = async () => {
    try {
      if (!originCoordinates) return;
      const response = await fetch(
        `https://rsapi.goong.io/geocode?latlng=${originCoordinates[1]}%2C${originCoordinates[0]}&api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setOriginQuery(data.results[0].formatted_address);
        setOriginSelected(true);
      }
    } catch (error) {
      console.error("Error getting stringed location:", error);
    }
  };

  useEffect(() => {
    if (!originQuery) {
      getStringedLocation();
    }
  }, [originCoordinates]);

  // Hàm gọi API Geocode để lấy tọa độ từ địa chỉ nhập vào
  const fetchLocationFromGeocoding = async (address: string, isOrigin: boolean) => {
    try {
      const response = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv`
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

  // Khi người dùng nhập lại, chỉ cập nhật query và reset flag (không xóa route hiện tại)
  const handleOriginChange = (text: string) => {
    setOriginQuery(text);
    setOriginSelected(false);
  };

  const handleDestinationChange = (text: string) => {
    setDestinationQuery(text);
    setDestinationSelected(false);
  };

  // Hàm tìm kiếm autocomplete cho origin (thêm tham số location để gợi ý chính xác)
  const searchOriginLocation = async () => {
    if (originQuery.trim() === "") {
      setOriginResults([]);
      return;
    }
    try {
      const locationParam = originCoordinates ? `&location=${originCoordinates[1]},${originCoordinates[0]}` : "";
      const response = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv&input=${originQuery}${locationParam}`
      );
      const data = await response.json();
      setOriginResults(data.predictions || []);
    } catch (error) {
      console.error("Error fetching origin search results:", error);
    }
  };

  // Hàm tìm kiếm autocomplete cho destination (thêm tham số location)
  const searchDestinationLocation = async () => {
    if (destinationQuery.trim() === "") {
      setDestinationResults([]);
      return;
    }
    try {
      const locationParam = originCoordinates ? `&location=${originCoordinates[1]},${originCoordinates[0]}` : "";
      const response = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv&input=${destinationQuery}${locationParam}`
      );
      const data = await response.json();
      setDestinationResults(data.predictions || []);
    } catch (error) {
      console.error("Error fetching destination search results:", error);
    }
  };

  // Debounce cho input
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

  // Khi cả origin và destination đã được chọn, gọi fetchDirections
  useEffect(() => {
    if (originSelected && destinationSelected && originCoordinates && destinationCoordinates) {
      fetchDirections();
    }
  }, [originCoordinates, destinationCoordinates, originSelected, destinationSelected]);

  // Hàm gọi API Directions của Goong (xe tải)
  const fetchDirections = async () => {
    const originStr = originCoordinates?.[1] !== undefined && originCoordinates?.[0] !== undefined
      ? `${originCoordinates[1]},${originCoordinates[0]}`
      : "0,0"; // Default value
    const destinationStr = `${destinationCoordinates![1]},${destinationCoordinates![0]}`;
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

  // Khi tuyến đường được vẽ, tự động zoom camera vào toàn bộ tuyến đường
  useEffect(() => {
    if (routeCoordinates.length > 0 && camera.current) {
      const lats = routeCoordinates.map(coord => coord[1]);
      const lngs = routeCoordinates.map(coord => coord[0]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      camera.current.setCamera({
        bounds: {
          ne: [maxLng, maxLat],
          sw: [minLng, minLat],
        },
        zoomLevel: 16,
        animationDuration: 1000,
      });
    }
  }, [routeCoordinates]);

  // Khi directionsInfo có dữ liệu, mở Actionsheet và gọi API tính tiền
  useEffect(() => {
    if (directionsInfo) {
      setShowActionsheet(true);
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
      {/* Marker luôn hiển thị cho vị trí hiện tại của khách */}



      {/* Container input (trên đầu map) */}
      <Box className="absolute top-0 left-0 w-full z-10 p-4">
        {/* Input origin */}
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
                  fetchLocationFromGeocoding(item.description, true);
                }}
                className="p-2"
              >
                <Text className="text-black">{item.description}</Text>
              </Pressable>
            )}
          />
        )}

        {/* Input destination */}
        <Box className="mt-2">
          <Input variant="outline" size="md" className="bg-white" isDisabled={!originSelected}>
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

      {/* Bản đồ */}
      <Box className="flex-1">
        <MapboxGL.MapView
          styleURL={loadMap}
          style={{ flex: 1 }}
          projection="globe"
          zoomEnabled={true}
        >
          {originCoordinates &&
            <MapboxGL.Camera
              ref={camera}
              zoomLevel={12}
              centerCoordinate={originCoordinates}
            />
          }
          {currentLocation && (
            <MapboxGL.PointAnnotation id="current-location" coordinate={currentLocation}>
              <Box style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                <LocateFixed color="#0080FF" size={28} />
              </Box>
            </MapboxGL.PointAnnotation>
          )}

          {originCoordinates &&
            <MapboxGL.PointAnnotation id="origin-marker" coordinate={originCoordinates}>
              <MapboxGL.Callout title="Origin" />
            </MapboxGL.PointAnnotation>
          }
          {destinationCoordinates && (
            <MapboxGL.PointAnnotation id="destination-marker" coordinate={destinationCoordinates} >
              {/* <MapboxGL.Callout title="Destination" /> */}
              <Box className=" w-40 h-40 items-center  relative z-10 -bottom-1 border-red-400 border-2" >
                <CircleChevronDown color="#0080FF" size={30} />
              </Box>
            </MapboxGL.PointAnnotation>
          )}
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

      {/* Actionsheet luôn mở, snapPoints: mở 30% màn hình, thu gọn xuống 20% */}
      {showActionsheet && (
        <Actionsheet
          isOpen={true}
          onClose={() => { }}
          snapPoints={[50, 2]}
        >
          <ActionsheetContent
            className="bg-white rounded-t-xl"
          >
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
              {/* Không có nút "Close" */}
            </Box>
          </ActionsheetContent>
        </Actionsheet>
      )}
    </Box>
  );
};

export default RescueMapScreen;
