import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import MapboxGL from "@rnmapbox/maps";
import axios from "axios";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";
// Import the ActionSheet components from gluestack-ui
import { createRepairRequest, getUnpaidPaymentsByRequestId, updatePaymentStatus, updateRequestStatus } from "@/app/services/beAPI";
import { getDirections } from "@/app/services/goongAPI";
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
import { MessageSquare } from "lucide-react-native";
import { GoBackButton } from "@/components/custom/GoBackButton";

type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};

interface RequestDetail {
  requestid: string,
  servicepackagename: string,
  requesttype: string,
  customername: string;
  customerphone: string;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  paymentmethod: string;
  paymentstatus: string;
  pickuplong: number;
  pickuplat: number;
  deslng: number;
  deslat: number;
  requeststatus: string;
}

interface UnpaidPayments {
  paymentid: string,
  paymentmethod: string,
  paymentstatus: string,
  totalamount: number,
  requestdetailid: string,
  name: string,
  requestid: string
}

interface DirectionsLeg {
  distance: { text: string };
  duration: { text: string };
}

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
  const userId = decodedToken(token)?.id;
  const {
    jsonCurLoc = '{"latitude":0,"longitude":0}',
    jsonUsers = "{}"
  } = useLocalSearchParams<any>();
  const router = useRouter();

  // Parse users from JSON and reconstruct the Map
  const [users, setUsers] = useState<Map<string, User>>(new Map(Object.entries(JSON.parse(jsonUsers))));
  // Parse currentLoc
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });

  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [originCoordinates, setOriginCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [destinationCoordinates, setDestinationCoordinates] = useState({ latitude: 0, longitude: 0 });

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [directionsInfo, setDirectionsInfo] = useState<DirectionsLeg | null>(null);
  // State to control the open/close state of the ActionSheet.
  const [isActionSheetOpen, setIsActionSheetOpen] = useState<boolean>(true);

  const [unpaidPayments, setUnpaidPayments] = useState<UnpaidPayments[]>([]);


  const camera = useRef<MapboxGL.Camera>(null);

  const [focusOnMe, setFocusOnMe] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const changeRequestStatus = async () => {
    let newStatus = "";
    if (requestDetail?.requesttype === "Cứu hộ") {
      switch (requestDetail?.requeststatus) {
        case "Accepted":
          newStatus = "Pickup";
          break;
        case "Pickup":
          newStatus = "Processing";
          break;
        case "Processing":
          newStatus = "Done";
          break;
        default:
          break;
      }
    }
    else if (requestDetail?.requesttype === "Trả xe") {
      switch (requestDetail?.requeststatus) {
        case "Accepted":
          newStatus = "Processing";
          break;
        case "Processing":
          newStatus = "Done";
          break;
        default:
          break;
      }
    }
    const result = await updateRequestStatus(requestdetailid, token, newStatus);
    fetchRequestDetail();
    if (result && requestDetail?.requeststatus === "Processing"
      && requestDetail?.servicepackagename === "Cứu hộ đến trạm"
      && requestDetail?.requesttype === "Cứu hộ") {
      createRepairRequest(requestDetail?.requestid, token)
    }
  };

  const changeButtonColor = (): string => {
    switch (requestDetail?.requeststatus) {
      case "Accepted":
        return "bg-yellow-500";
      case "Pickup":
        return "bg-blue-500";
      case "Processing":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const changeButtonTitle = (): string => {
    switch (requestDetail?.requeststatus) {
      case "Accepted":
        if (requestDetail?.requesttype === "Cứu hộ") {
          return "Đi đến điểm đón";
        }
        if (requestDetail?.requesttype === "Trả xe") {
          return "Bắt đầu trả xe";
        }
        break; // Prevents fall-through

      case "Pickup":
        return "Tiến hành chở khách";

      case "Processing":
        if (requestDetail?.requesttype === "Cứu hộ") {
          return "Trả khách";
        }
        if (requestDetail?.requesttype === "Trả xe") {
          return "Trả xe";
        }
        break; // Prevents fall-through

      default:
        if (requestDetail?.requesttype === "Cứu hộ") {
          return "Trả khách hoàn tất";
        }
        if (requestDetail?.requesttype === "Trả xe") {
          return "Trả xe hoàn tất";
        }
    }

    // Ensure a string is always returned
    return "Trạng thái không xác định"; // Default fallback
  };

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
  const fetchUnpaidPayments = async () => {
    const requestId = requestDetail?.requestid;
    if (requestId)
      try {
        const results = await getUnpaidPaymentsByRequestId(requestId, token);
        setUnpaidPayments(results);
      } catch (error: any) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    // Immediately fetch on mount or when dependencies change
    fetchRequestDetail();
    fetchUnpaidPayments();

    // Set up an interval to re-fetch every 5 seconds
    const interval = setInterval(() => {
      fetchRequestDetail();
      fetchUnpaidPayments();
    }, 5000);

    // Clear the interval on cleanup
    return () => clearInterval(interval);
  }, [requestdetailid, token]);

  const fetchRoute = () => {
    const currentLocStr = `${currentLoc.latitude},${currentLoc.longitude}`;
    const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
    const destinationStr = `${destinationCoordinates.latitude},${destinationCoordinates.longitude}`;
    let startStr = "";
    let endStr = "";

    if (requestDetail?.requeststatus === 'Done') return setRouteCoordinates([]);
    switch (requestDetail?.requeststatus) {
      case "Accepted":
        startStr = originStr;
        endStr = requestDetail.destination ? destinationStr : originStr;
        break; // ✅ Use break instead of return
      case "Pickup":
        startStr = currentLocStr;
        endStr = originStr;
        break; // ✅ Use break instead of return
      case "Processing":
        startStr = currentLocStr;
        endStr = requestDetail.destination ? destinationStr : originStr;
        break; // ✅ Use break instead of return
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
    try {
      setCurrentLoc(JSON.parse(jsonCurLoc));
    } catch (error) {
      console.error("Failed to parse jsonCurLoc:", error, jsonCurLoc);
      setCurrentLoc({ latitude: 0, longitude: 0 });
    }
  }, [jsonCurLoc]);

  useEffect(() => {
    try {
      const parsedUsers = JSON.parse(jsonUsers);
      if (typeof parsedUsers === "object" && parsedUsers !== null) {
        setUsers(new Map(Object.entries(parsedUsers)));
      } else {
        setUsers(new Map());
      }
    } catch (error) {
      console.error("Failed to parse jsonUsers:", error, jsonUsers);
      setUsers(new Map());
    }
  }, [jsonUsers]);

  useEffect(() => {
    fetchRoute();
  }, [currentLoc, requestDetail?.requeststatus]);


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

  const toChatScreen = () => {
    router.push({
      pathname: "/user/driver/requests/chatScreen",
      params: {
        currentUserId: userId,
        requestDetailId: requestdetailid
      }
    });
  }

  useEffect(() => {
    if (requestDetail?.requeststatus === 'Done' && unpaidPayments.length > 0) {
      setIsActionSheetOpen(false);
      router.push({
        pathname: "/user/driver/requests/payments",
        params: {
          requestId: requestDetail.requestid,
          unpaidPayments: JSON.stringify(unpaidPayments)
        },
      });
    }
  }, [requestDetail?.requeststatus]);
  return (
    <Box className="flex-1">
      <GoBackButton />
      <MapViewComponent users={users} currentLoc={focusOnMe ? currentLoc : originCoordinates} focusMode={[focusOnMe, setFocusOnMe]} isActionSheetOpen={isActionSheetOpen}>
        <MapboxGL.Camera ref={camera}
          centerCoordinate={
            focusOnMe ? [currentLoc.longitude, currentLoc.latitude] : [originCoordinates.longitude, originCoordinates.latitude]}
        />
        {originCoordinates && (
          <MapboxGL.PointAnnotation id="ori-marker" coordinate={[originCoordinates.longitude, originCoordinates.latitude]}>
            <MapboxGL.Callout title="Origin" />
          </MapboxGL.PointAnnotation>
        )}
        {requestDetail?.destination && destinationCoordinates && (
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
          <Button variant="outline" size="md" onPress={toChatScreen}>
            <ButtonText>
              <MessageSquare size={18} color="#4B5563" style={{ marginTop: 2 }} /> Chat
            </ButtonText>
          </Button>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <View className="space-y-2">
              <Text className="text-lg font-bold">
                Full name: {requestDetail?.customername}
              </Text>
              <Text className="text-gray-600">
                📞 Phone: {requestDetail?.customerphone}
              </Text>
              <Text className="text-gray-700">
                📍 Xuất phát ở: {requestDetail?.pickuplocation}
              </Text>
              {requestDetail?.destination &&
                <>
                  <Text className="text-gray-700">
                    📍 Kết thúc tại: {requestDetail?.destination}
                  </Text>
                  <Text className="text-gray-700">
                    Distance: {directionsInfo?.distance?.text}
                  </Text>
                  <Text className="text-gray-700">
                    Duration: {directionsInfo?.duration?.text}
                  </Text>
                </>
              }
              <Text className="text-green-600 font-semibold">
                💰 Tổng tiền: {requestDetail?.totalprice.toLocaleString()} VND
              </Text>
              <Text className="text-green-600 font-semibold">
                💰 Phương thức thanh toán: {requestDetail?.paymentmethod}
              </Text>
              <View
                className="m-5 flex flex-col justify-between items-center"
              >
                <Button
                  className={`${changeButtonColor()} p-2 rounded`}
                  size="lg"
                  onPress={changeRequestStatus}
                  disabled={requestDetail?.requeststatus === 'Done' ? true : false}
                >
                  <Text className="text-white text-center">
                    {changeButtonTitle()}
                  </Text>
                </Button>
              </View>
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

    </Box>
  );
};

export default RequestMap;
