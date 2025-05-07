import { AuthContext } from "@/app/context/AuthContext";
import { useCurrentLocStore } from "@/app/hooks/currentLocStore";
import { useUsersStore } from "@/app/hooks/usersStore";
import { createRepairRequest, fetchRescueRequestDetail, getUndoneRequestDetailIds, getUnpaidPaymentsByRequestId, updatePaymentTotal, updateRequestStatus } from "@/app/services/beAPI";
import { getDirections } from "@/app/services/goongAPI";
import { decodedToken, decodePolyline, formatMoney, handlePhoneCall } from "@/app/utils/utils";
import { DestinationMarker, OriginMarker } from "@/components/custom/CustomMapMarker";
import DriverRequestDetail from "@/components/custom/DriverRequestDetail";
import MapViewComponent from "@/components/custom/MapViewComponent";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import MapboxGL from "@rnmapbox/maps";
import { useRouter } from "expo-router";
import { AlertCircle, Clock, CreditCard, MapPin, MapPinCheckInsideIcon, MessageSquare, Navigation2, Phone } from "lucide-react-native";
import React, { useContext, useEffect, useReducer, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { TripAction, tripReducer, TripState } from "../../utils/fareCal";
import { DriverRescueRequestDetail } from "@/app/context/formFields";
import { User } from "@pubnub/chat";
import { UnpaidPaymentList } from "@/components/custom/UnpaidPayments";

interface UnpaidPayments {
  paymentid: string;
  paymentmethod: string;
  paymentstatus: string;
  totalamount: number;
  requestdetailid: string;
  name: string;
  requestid: string;
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


// Trước chỗ useState cho currentLoc/users, thêm:
const initialTrip: TripState = {
  status: 'idle',
  lastTime: 0,
  lastCoords: { latitude: 0, longitude: 0 },  // ← phải có cả latitude và longitude
  distance: 0,
  waiting: 0,
  fare: 0,
};

const GenMap: React.FC = () => {
  const [curReqDetId, setCurReqDetId] = useState<string | null>(null);
  const { token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;

  const router = useRouter();
  const {
    currentLoc,
  } = useCurrentLocStore();
  const {
    users,
  } = useUsersStore();

  const [trip, dispatch] = useReducer(tripReducer, initialTrip);

  const [requestDetail, setRequestDetail] = useState<DriverRescueRequestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [originCoordinates, setOriginCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [destinationCoordinates, setDestinationCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [directionsInfo, setDirectionsInfo] = useState<DirectionsLeg | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState<boolean>(true);
  const [unpaidPayments, setUnpaidPayments] = useState<UnpaidPayments[]>([]);
  const camera = useRef<MapboxGL.Camera>(null);
  const [focusOnMe, setFocusOnMe] = useState<boolean>(true);

  const resetCoordinates = () => {
    setOriginCoordinates({ latitude: 0, longitude: 0 });
    setDestinationCoordinates({ latitude: 0, longitude: 0 });
    setRouteCoordinates([]);
  }
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
    } else if (requestDetail?.requesttype === "Trả xe") {
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
    if (curReqDetId) {
      const result = await updateRequestStatus(curReqDetId, token, newStatus);
      if (result) fetchRequestDetail();

      if (
        result &&
        requestDetail?.requeststatus === "Processing" &&
        requestDetail?.requesttype === "Cứu hộ"
      ) {
        switch (requestDetail?.servicepackagename) {
          case "Cứu hộ đến trạm":
            createRepairRequest(requestDetail?.requestid, token); 
            break;
          case "Cứu hộ nước ngập":
            changePaymentTotal();
            break;
          }
          router.push({
            pathname: "/user/driver/requests/requestMap",
            params: { requestdetailid: curReqDetId },
          })
        }
      }
      return;
  };

  const changePaymentTotal = async () => {
    if (!curReqDetId) return;
    const payload = {
      requestDetailId: curReqDetId,
      newTotal: trip?.fare || 0,
    };
    const result = await updatePaymentTotal(payload, token);
    setLoading(true)
    if (result) fetchUnpaidPayments();
  };

  const changeButtonColor = (): string => {
    switch (requestDetail?.requeststatus) {
      case "Accepted":
        return "bg-[#fab753]";
      case "Pickup":
        return "bg-[#1a3148]";
      case "Processing":
        return "bg-[#fab753]";
      default:
        return "bg-green-500";
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
        break;

      case "Pickup":
        return "Tiến hành chở khách";

      case "Processing":
        if (requestDetail?.requesttype === "Cứu hộ") {
          return "Trả khách";
        }
        if (requestDetail?.requesttype === "Trả xe") {
          return "Trả xe";
        }
        break;

      default:
        if (requestDetail?.requesttype === "Cứu hộ") {
          return "Trả khách hoàn tất";
        }
        if (requestDetail?.requesttype === "Trả xe") {
          return "Trả xe hoàn tất";
        }
    }

    return "Trạng thái không xác định";
  };

  const fetchUndoneRequestDetails = async () => {
    try {
      const results = await getUndoneRequestDetailIds(token);
      if (results && results.length > 0) {
        if (results.length > 1)
          setCurReqDetId(results[1].requestdetailid);
        else setCurReqDetId(results[0].requestdetailid);
      }
      else {
        setCurReqDetId(null);
        resetCoordinates();
      };
    } catch (error) {
      console.error("Error fetching undone request details:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchRequestDetail = async () => {
    try {
      if (!curReqDetId) return;
      console.log('curReq: ' + curReqDetId)
      const results = await fetchRescueRequestDetail(token, curReqDetId)
      setRequestDetail(results);
      setOriginCoordinates({
        latitude: results.pickuplat,
        longitude: results.pickuplong,
      });
      setDestinationCoordinates({
        latitude: results.deslat,
        longitude: results.deslng,
      });
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpaidPayments = async () => {
    if (!curReqDetId) return;
    const requestId = requestDetail?.requestid;
    if (requestId)
      try {
        const results = await getUnpaidPaymentsByRequestId(requestId, token);
        setUnpaidPayments(results);
        if (results.length <= 0) {
          setRequestDetail(null);
          setRouteCoordinates([]);
          setOriginCoordinates({ latitude: 0, longitude: 0 });
          setDestinationCoordinates({ latitude: 0, longitude: 0 });
          fetchUndoneRequestDetails();
        }
      } catch (error: any) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    if (!curReqDetId) return;
    const interval = setInterval(() => {
      if (requestDetail?.requeststatus === "Done") {
        fetchUnpaidPayments();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [curReqDetId, token]);

  const fetchRoute = () => {
    if (curReqDetId === null) return;
    const currentLocStr = `${currentLoc.latitude},${currentLoc.longitude}`;
    const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
    const destinationStr = `${destinationCoordinates.latitude},${destinationCoordinates.longitude}`;
    let startStr = "";
    let endStr = "";

    if (requestDetail?.requeststatus === "Done") return setRouteCoordinates([]);
    switch (requestDetail?.requeststatus) {
      case "Accepted":
        startStr = originStr;
        endStr = requestDetail.destination ? destinationStr : originStr;
        break;
      case "Pickup":
        startStr = currentLocStr;
        endStr = originStr;
        break;
      case "Processing":
        startStr = currentLocStr;
        endStr = requestDetail.destination ? destinationStr : originStr;
        break;
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
      .catch((error: any) => console.error("Error fetching directions:", error));
  };

  useEffect(() => {
    fetchUndoneRequestDetails();
    fetchRequestDetail();
    fetchRoute();
  }, [currentLoc, requestDetail?.requeststatus]);

  useEffect(() => {
    if (!requestDetail || requestDetail.servicepackagename !== 'Cứu hộ nước ngập') return;
    if (requestDetail.requeststatus === 'Pickup') {
      dispatch({
        type: 'START',
        timestamp: Date.now(),
        coords: currentLoc
      } as TripAction);
    }
    if (requestDetail.requeststatus === 'Done'|| requestDetail.requeststatus === 'Cancel') {
      dispatch({ type: 'END' } as TripAction);
    }
  }, [requestDetail, currentLoc]);

  // On every loc update, if running, dispatch UPDATE
  useEffect(() => {
    if (trip.status === 'running') {
      dispatch({
        type: 'UPDATE',
        timestamp: Date.now(),
        coords: { latitude: currentLoc.latitude, longitude: currentLoc.longitude },
      } as TripAction);
    }
  }, [currentLoc]);

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
        zoomLevel: 14,
        animationDuration: 1000,
      });
    }
  }, [routeCoordinates]);

  const toChatScreen = () => {
    setIsActionSheetOpen(false);
    router.push({
      pathname: "/user/driver/requests/chatScreen",
      params: {
        currentUserId: userId,
        requestDetailId: curReqDetId,
      },
    });
  };

  return (
    <Box className="flex-1">
      {loading ? (
        <ActivityIndicator size="large" color="#fab753" />
      ) : (requestDetail?.requeststatus === "Done" && curReqDetId) ? (
        <DriverRequestDetail
          requestDetail={requestDetail}
          changeButtonTitle={changeButtonTitle}
          toChatScreen={toChatScreen}
        />
      ) : (
        <>
          <MapViewComponent
            users={users}
            currentLoc={currentLoc}
            focusMode={[focusOnMe, setFocusOnMe]}
            isActionSheetOpen={isActionSheetOpen}
            role="Driver"
            // driverHeading={users.get(userId)?.heading || 0} 
            // driverHeading={users.get(userId ?? '')?.heading || 0}
            // user={users.get(userId ?? '')?.heading || 0}
            userId={users.get(userId ?? '')?.uuid || ''}
            // driverHeading={users.get(userId ?? '')?.heading || 0}
            
          >


            
            {!focusOnMe &&
              requestDetail?.requeststatus === "Pickup" &&
              originCoordinates.latitude !== 0 && (
                <MapboxGL.Camera
                  centerCoordinate={[originCoordinates.longitude, originCoordinates.latitude]}
                  zoomLevel={14}
                  animationDuration={1000}
                />
              )}

            {!focusOnMe &&
              requestDetail?.requeststatus === "Processing" &&
              destinationCoordinates.latitude !== 0 && (
                <MapboxGL.Camera
                  centerCoordinate={[destinationCoordinates.longitude, destinationCoordinates.latitude]}
                  zoomLevel={14}
                  animationDuration={1000}
                />
              )}
            {requestDetail?.requeststatus !== 'Processing' && originCoordinates && (
              <MapboxGL.MarkerView
                id="origin-marker"
                coordinate={[originCoordinates.longitude, originCoordinates.latitude]}
              >
                <OriginMarker size={32} />
              </MapboxGL.MarkerView>
            )}
            {requestDetail?.requeststatus !== 'Pickup' && requestDetail?.destination && destinationCoordinates && (
              <MapboxGL.MarkerView
                id="destination-marker"
                coordinate={[destinationCoordinates.longitude, destinationCoordinates.latitude]}
              >
                <DestinationMarker size={32} />
              </MapboxGL.MarkerView>
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

          {/* Fare meter panel, only for flood service */}
          {requestDetail?.servicepackagename === 'Cứu hộ nước ngập' && (
            <Box className="p-4 bg-white absolute bottom-0 w-full">
              <Text className="text-gray-500">Cước ước tính:</Text>
              <Text className="text-2xl font-bold">{trip.fare?.toLocaleString()} VND</Text>
            </Box>
          )}

          {curReqDetId &&
            <Actionsheet
              isOpen={isActionSheetOpen}
              onClose={() => setIsActionSheetOpen(false)}
            >
              <ActionsheetBackdrop />
              <ActionsheetContent className="bg-white rounded-t-3xl px-0 pt-2 pb-6">
                <ActionsheetDragIndicatorWrapper>
                  <ActionsheetDragIndicator className="bg-gray-300" />
                </ActionsheetDragIndicatorWrapper>

                {!requestDetail?.servicepackagename ? (
                    <Box className="flex items-center justify-center h-2/5">
                      <ActivityIndicator size="large" color="#fab753" />
                    </Box>
                ) : (
                  <Box className="space-y-4 px-4 w-full">
                    <Box className="flex-row items-center justify-between w-full">
                      <Box className="flex-1">
                        <Text className="text-2xl font-bold text-[#1a3148] mb-1">
                          {requestDetail?.customername ? requestDetail?.customername : requestDetail?.receivername}
                        </Text>
                      </Box>

                      <Box className="flex-row gap-3 pb-2">
                        <Button
                          variant="solid"
                          onPress={() => handlePhoneCall(requestDetail?.customerphone)}
                          className={`rounded-xl h-12 w-12 items-center justify-center ${requestDetail?.requeststatus === "Done"
                            ? "bg-gray-200"
                            : "bg-[#1a3148]"
                            }`}
                          disabled={requestDetail?.requeststatus === "Done"}
                        >
                          <Phone size={22} color={requestDetail?.requeststatus === "Done" ? "#9CA3AF" : "white"} />
                        </Button>
                        <Button
                          variant="solid"
                          onPress={toChatScreen}
                          className={`rounded-xl h-12 w-12 items-center justify-center ${requestDetail?.requeststatus === "Done"
                            ? "bg-gray-200"
                            : "bg-[#fab753]"
                            }`}
                          disabled={requestDetail?.requeststatus === "Done"}
                        >
                          <MessageSquare size={22} color={requestDetail?.requeststatus === "Done" ? "#9CA3AF" : "white"} />
                        </Button>
                      </Box>
                    </Box>

                    {directionsInfo && (
                      <Box className="flex-row w-full bg-[#f8fafc] rounded-xl p-4">
                        <Box className="flex-1 items-center">
                          <Box className="flex-row items-center mb-2">
                            <Box className="w-12 h-12 bg-[#1a3148]/5 rounded-xl items-center justify-center">
                              <Navigation2 size={24} color="#1a3148" />
                            </Box>
                            <Box className="ml-3">
                              <Text className="text-sm text-gray-500">Distance</Text>
                              <Text className="text-xl font-bold text-[#1a3148]">
                                {directionsInfo?.distance?.text}
                              </Text>
                            </Box>
                          </Box>
                        </Box>

                        <Box className="w-[1px] h-16 bg-gray-200 mx-2 self-center" />

                        <Box className="flex-1 items-center">
                          <Box className="flex-row items-center mb-2">
                            <Box className="w-12 h-12 bg-[#1a3148]/5 rounded-xl items-center justify-center">
                              <Clock size={24} color="#1a3148" />
                            </Box>
                            <Box className="ml-3">
                              <Text className="text-sm text-gray-500">Duration</Text>
                              <Text className="text-xl font-bold text-[#1a3148]">
                                {directionsInfo?.duration?.text}
                              </Text>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    <Box className="bg-[#f8fafc] rounded-xl p-4 space-y-3 w-full relative">
                      {requestDetail?.destination && (
                        <Box className="absolute left-[31px] top-[60px] w-[1.5px] h-[28px] bg-black/10" />
                      )}
                      <Box className="flex-row items-center w-full">
                        <Box className="w-10 h-10 bg-[#1a3148]/5 rounded-lg items-center justify-center">
                          <MapPin size={20} color="#1a3148" />
                        </Box>
                        <Box className="ml-3 flex-1">
                          <Text className="text-sm text-gray-500">Pickup Location</Text>
                          <Text className="text-base font-medium text-[#1a3148]">
                            {requestDetail?.pickuplocation}
                          </Text>
                        </Box>
                      </Box>

                      {requestDetail?.destination && (
                        <Box className="flex-row items-center w-full">
                          <Box className="w-10 h-10 bg-[#fab753]/10 rounded-lg items-center justify-center">
                            {requestDetail?.requeststatus === "Done" ? (
                              <MapPinCheckInsideIcon size={20} color="#fab753" />
                            ) : (
                              <AlertCircle size={20} color="#fab753" />
                            )}
                          </Box>
                          <Box className="ml-3 flex-1">
                            <Text className="text-sm text-gray-500">Destination</Text>
                            <Text className="text-base font-medium text-[#1a3148]">
                              {requestDetail?.destination}
                            </Text>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    <Box className="w-full bg-[#f8fafc] rounded-xl p-4">
                      <Box className="flex-row items-center justify-between">
                        <Box>
                          <Box className="flex-row items-center mb-1">
                            <CreditCard size={18} color="#1a3148" />
                            <Text className="text-sm text-gray-500 ml-2">Total Price</Text>
                          </Box>
                          <Text className="text-xl font-bold text-[#1a3148]">
                            <Text className="text-2xl font-bold">
                              {requestDetail?.servicepackagename === 'Cứu hộ nước ngập' ?
                                formatMoney(trip?.fare) :
                                formatMoney(requestDetail?.totalprice || 0)
                              }
                            </Text>
                          </Text>
                        </Box>
                        <Box className="bg-black px-4 py-2 rounded-lg">
                          <Text className="text-white font-bold">
                            {requestDetail?.paymentmethod}
                          </Text>
                        </Box>
                      </Box>
                    </Box>

                    <Button
                      className={`h-14 rounded-xl ${changeButtonColor()} active:opacity-80 shadow-sm`}
                      onPress={changeRequestStatus}
                      disabled={requestDetail?.requeststatus === "Done"}
                    >
                      <ButtonText className={`font-bold text-lg ${requestDetail?.requeststatus === "Pickup" ||
                        requestDetail?.requeststatus === "Processing" ||
                        requestDetail?.requeststatus === "Done"
                        ? "text-white"
                        : "text-[#1a3148]"
                        }`}>
                        {changeButtonTitle()}
                      </ButtonText>
                    </Button>
                  </Box>
                )}
              </ActionsheetContent>
            </Actionsheet>
          }

          {curReqDetId &&
            <TouchableOpacity
              onPress={() => setIsActionSheetOpen(true)}
              className="absolute bottom-24 right-5 w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
            >
              <Box className="rotate-180">
                <Icon name="chevron-down" size={24} color="#1a3148" />
              </Box>
            </TouchableOpacity>
          }
        </>
      )}
      {/* {requestDetail?.requestid && requestDetail?.requeststatus === "Done" && unpaidPayments.length > 0 &&
        <UnpaidPaymentList requestId={requestDetail?.requestid} />
      } */}
    </Box>
  );
};

export default GenMap;
