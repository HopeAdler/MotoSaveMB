import { AuthContext } from "@/app/context/AuthContext";
import { useCameraZoom } from "@/app/hooks/useCameraZoom";
import {
  calculateFare,
  createEmergencyRescueRequest,
  createPayment,
  createTransaction,
  EmergencyRescueRequestPayload,
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
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import MapboxGL from "@rnmapbox/maps";
import { router } from "expo-router";
import { getDistance } from "geolib";
import {
  ChevronLeft,
  ChevronUp,
  CircleChevronDown,
  LocateFixed,
  Cog,
  MapPin,
  Pen,
  Pin,
} from "lucide-react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  NativeEventEmitter,
  NativeModules,
  Text,
} from "react-native";
import TrackingActionSheet from "@/components/custom/TrackingActionSheet";
import TripDetailsActionSheet, {
  CustomerVehicle,
} from "@/components/custom/TripDetailsActionSheet";
import {
  getCurrentLocation,
  requestLocationPermission,
  watchLocation,
} from "@/app/services/locationService";
import {
  PayZaloEventData,
  processPayment,
  refundTransaction,
} from "@/app/utils/payment";
import { decodedToken } from "@/app/utils/utils";
import MapViewComponent from "../../../../../components/custom/MapViewComponent";
import { usePubNubService } from "@/app/services/pubnubService";
import { User } from "../../../../context/formFields";
import StationSelect, { Station } from "@/components/custom/StationSelect";
import beAPI from "@/app/services/beAPI";
import { Filter } from "react-native-svg";
import { OriginMarker, DestinationMarker, renderStationMarkers } from "@/components/custom/CustomMapMarker";
import { BackButton, SearchInput, SearchResults, ActionSheetToggle } from "../../../../../components/custom/MapUIComponents";
import VehicleAlertDialog from "../../../../../components/custom/VehicleAlertDialog";

const { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } = process.env;
MapboxGL.setAccessToken(`${EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`);

// Các hằng số
const INITIAL_RADIUS = 5000; // 5 km
const MAX_RADIUS = 20000; // 20 km
const MAX_WARN_PICKUP_DISTANCE = 2000; // 2 km cho điểm đón
const MAX_WARN_DESTINATION_DISTANCE = 50000; // 50 km cho điểm đến
const SERVICE_STATION_RADIUS = 20000; // 20 km phạm vi phục vụ

const EmergencyRescueMapScreen = () => {
  const {
    publishLocation,
    publishRescueRequest,
    subscribeToChannel,
    subscribeToRescueChannel,
    hereNow,
  } = usePubNubService();
  const { user, token } = useContext(AuthContext);
  const { PayZaloBridge } = NativeModules;
  const userId = decodedToken(token)?.id;

  // Các state chính
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });
  const [originCoordinates, setOriginCoordinates] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [destinationCoordinates, setDestinationCoordinates] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [originQuery, setOriginQuery] = useState("");
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [stationQuery, setStationQuery] = useState<Station>();
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    []
  );
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [fareLoading, setFareLoading] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [originSelected, setOriginSelected] = useState(false);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [requestDetailId, setRequestDetailId] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [zpTransId, setZpTransId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [acceptedReqDetId, setAcceptedReqDetId] = useState<string>("");
  const [acceptedReqDetStatus, setAcceptedReqDetStatus] =
    useState<string>("Pending");
  const attemptedDriversRef = useRef<Set<string>>(new Set());
  const { createDirectChannel } = usePubNubService();
  const [acceptedDriverId, setAcceptedDriverId] = useState<string | null>(null);
  const isSearchingRef = useRef(isSearching);
  const [showVehicleAlert, setShowVehicleAlert] = useState(false);
  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  // State để lưu station đã chọn (ID)
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  // State để lưu vehicle id đã chọn
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  // State để lưu danh sách station (fetch qua beAPI)
  const [stations, setStations] = useState<Station[]>([]);
  useEffect(() => {
    beAPI
      .fetchStations()
      .then((data: Station[]) => {
        setStations(data);
      })
      .catch((error) =>
        console.error("Error fetching stations from beAPI:", error)
      );
  }, []);

  // Refs
  const camera = useRef<MapboxGL.Camera>(null);
  useCameraZoom(camera, routeCoordinates);

  // Khi originCoordinates chưa có query thì reverse geocode
  useEffect(() => {
    if (
      !originQuery &&
      originCoordinates.latitude &&
      originCoordinates.longitude
    ) {
      getReverseGeocode(
        originCoordinates.latitude,
        originCoordinates.longitude
      ).then((address) => {
        if (address) {
          setOriginQuery(address);
          setOriginSelected(true);
        }
      });
    }
  }, [originCoordinates]);

  // Tự động chọn station gần nhất nếu currentLoc và stations có dữ liệu và chưa có destination
  useEffect(() => {
    if (
      currentLoc.latitude &&
      currentLoc.longitude &&
      stations.length > 0 &&
      destinationCoordinates.latitude === 0
    ) {
      const nearest = stations.reduce((prev, curr) => {
        const prevDist = getDistance(currentLoc, {
          latitude: parseFloat(prev.lat),
          longitude: parseFloat(prev.long),
        });
        const currDist = getDistance(currentLoc, {
          latitude: parseFloat(curr.lat),
          longitude: parseFloat(curr.long),
        });
        return currDist < prevDist ? curr : prev;
      }, stations[0]);
      setDestinationCoordinates({
        latitude: parseFloat(nearest.lat),
        longitude: parseFloat(nearest.long),
      });
      setSelectedStationId(nearest.id);
      // Gọi luôn callback để cập nhật dữ liệu bên ngoài
      handleStationSelect(nearest);
    }
  }, [currentLoc, stations, destinationCoordinates]);

  // Xử lý khi người dùng chọn điểm đón (origin)
  const handleFetchOriginLocation = async (address: string) => {
    const result = await geocodeAddress(address);
    if (result) {
      const { lat, lng } = result;
      if (currentLoc.latitude !== 0 && currentLoc.longitude !== 0) {
        const distance = getDistance(currentLoc, {
          latitude: lat,
          longitude: lng,
        });
        if (distance > MAX_WARN_PICKUP_DISTANCE) {
          Alert.alert(
            "Điểm đón quá xa",
            "Điểm đón bạn chọn quá xa vị trí hiện tại. Vui lòng chọn lại vị trí gần hơn."
          );
          return;
        }
      }
      setOriginCoordinates({ latitude: lat, longitude: lng });
      setOriginResults([]);
      setOriginSelected(true);
      camera.current?.flyTo([lng, lat], 1000);
    }
  };

  // Xử lý thay đổi origin text input
  const handleOriginChange = (text: string) => {
    setOriginQuery(text);
    setOriginSelected(false);
  };

  // Lấy gợi ý địa chỉ cho origin
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

  // Lấy đường đi và tính toán cước phí
  useEffect(() => {
    if (
      originSelected &&
      destinationCoordinates.latitude !== 0 &&
      originCoordinates.latitude !== 0
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
  }, [originCoordinates, destinationCoordinates, originSelected]);

  // Tính toán cước phí khi có thông tin đường đi
  useEffect(() => {
    if (directionsInfo && !showActionsheet) {
      const distanceValue = directionsInfo.distance?.value || 0;
      setFareLoading(true);
      calculateFare(distanceValue)
        .then((money) => {
          setFare(money);
          setShowActionsheet(true);
          setFareLoading(false);
        })
        .catch((error) => {
          console.error("Error calculating fare:", error);
          setFareLoading(false);
        });
    }
  }, [directionsInfo]);

  // Hàm kiểm tra hợp lệ vị trí để kích hoạt nút confirm
  const isLocationValid = () => {
    if (
      originCoordinates.latitude === 0 ||
      destinationCoordinates.latitude === 0
    )
      return false;
    if (currentLoc.latitude !== 0 && currentLoc.longitude !== 0) {
      const distanceFromCurrent = getDistance(currentLoc, originCoordinates);
      if (distanceFromCurrent > MAX_WARN_PICKUP_DISTANCE) return false;
    }
    const distanceOriginToDest = getDistance(
      originCoordinates,
      destinationCoordinates
    );
    if (distanceOriginToDest > MAX_WARN_DESTINATION_DISTANCE) return false;
    return true;
  };

  // Hàm xử lý lựa chọn station cho destination
  const handleStationSelect = (station: Station) => {
    setDestinationCoordinates({
      latitude: parseFloat(station.lat),
      longitude: parseFloat(station.long),
    });
    setSelectedStationId(station.id);
  };

  // Tạo yêu cầu cứu hộ
  const handleCreateRequest = async (): Promise<string | void> => {
    attemptedDriversRef.current = new Set();
    if (!token) return;
    const payload: EmergencyRescueRequestPayload = {
      pickuplong: originCoordinates.longitude,
      pickuplat: originCoordinates.latitude,
      deslng: destinationCoordinates.longitude,
      deslat: destinationCoordinates.latitude,
      pickuplocation: originQuery,
      destination: stationQuery?.address || "",
      totalprice: fare || 0,
      stationid: stationQuery?.id || "",
      vehicleid: selectedVehicleId,
    };
    try {
      const result = await createEmergencyRescueRequest(payload, token);
      const reqId = result.requestdetailid;
      const payment = await createPayment(
        {
          requestdetailid: reqId,
          totalamount: fare,
          paymentmethod: "Tiền mặt",
          paymentstatus: "Unpaid",
        },
        token
      );
      console.log(payment);
      setShowActionsheet(true);
      setRequestDetailId(result.requestdetailid);
      return result.requestdetailid;
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  // Xử lý thanh toán qua ZaloPay
  const handlePayment = async () => {
    const callbackUrl =
      "myapp://user/customer/home/emergencyRescue/emergencyRescueMap";
    if (!token) return;
    setPaymentLoading(true);
    const payload: EmergencyRescueRequestPayload = {
      pickuplong: originCoordinates.longitude,
      pickuplat: originCoordinates.latitude,
      deslng: destinationCoordinates.longitude,
      deslat: destinationCoordinates.latitude,
      pickuplocation: originQuery,
      destination: stationQuery?.name || "",
      totalprice: fare || 0,
      stationid: stationQuery?.id || "",
      vehicleid: selectedVehicleId,
    };
    try {
      const result = await createEmergencyRescueRequest(payload, token);
      const reqId = result.requestdetailid;
      setRequestDetailId(reqId);
      setShowActionsheet(true);
      processPayment(fare, callbackUrl);
      const payZaloEmitter = new NativeEventEmitter(PayZaloBridge);
      const subscription = payZaloEmitter.addListener(
        "EventPayZalo",
        async (data: PayZaloEventData) => {
          if (data.returnCode === "1") {
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
              if (transactionResponse) {
                isSearchingRef.current = true;
                setIsSearching(true);
                // setDriverAccepted(false);
                sendRideRequestToDrivers(INITIAL_RADIUS, reqId);
              }
            } catch (error) {
              console.error("Error creating transaction:", error);
            }
          } else {
            Alert.alert("Payment failed!", "Return code: " + data.returnCode);
          }
          subscription.remove();
        }
      );
    } catch (error) {
      console.error("Error during payment:", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Ref lưu trạng thái yêu cầu được driver chấp nhận
  const acceptedRequestRef = useRef<{ id: string | null; status: string }>({
    id: null,
    status: "Pending",
  });

  useEffect(() => {
    acceptedRequestRef.current = {
      id: acceptedReqDetId || null,
      status: acceptedReqDetStatus,
    };
    if (acceptedReqDetId && acceptedReqDetStatus !== "Pending") {
      setShowActionsheet(false);
      setIsSearching(false);
      setShowTracking(true);
    }
  }, [acceptedReqDetId, acceptedReqDetStatus]);

  useEffect(() => {
    if (selectedStationId) {
      setStationQuery(
        stations.find((station: Station) => station.id === selectedStationId)
      );
    }
  }, [selectedStationId, stations]);
  // Gửi yêu cầu đến các tài xế theo bán kính tìm kiếm
  const sendRideRequestToDrivers = async (radius: number, reqId: string) => {
    // Kiểm tra ngay từ đầu: nếu người dùng đã hủy thì dừng luôn
    if (!isSearchingRef.current) {
      console.log("Search has been canceled. Exiting.");
      return;
    }
    // Kiểm tra nếu request đã được driver chấp nhận thì dừng luôn
    if (
      acceptedRequestRef.current.id === reqId &&
      acceptedRequestRef.current.status !== "Pending"
    ) {
      console.log("Driver đã chấp nhận request, dừng tìm kiếm.");
      return;
    }
    // Nếu vượt quá bán kính tối đa, dừng tìm kiếm và kích hoạt hủy
    if (radius > MAX_RADIUS) {
      console.log(
        `Đã vượt quá bán kính tối đa ${MAX_RADIUS}. Dừng tìm kiếm với reqId:`,
        reqId
      );
      Alert.alert(
        "No drivers available",
        "No drivers available in search radius"
      );

      // Đặt UI state
      isSearchingRef.current = false;
      setIsSearching(false);
      setShowActionsheet(true);

      try {
        // Gọi trực tiếp API để cancel request
        const result = await updateRequestStatus(reqId, token, "Cancel");
        console.log("Đã hủy request thành công:", result);
      } catch (error) {
        console.error("Lỗi khi tự động hủy request:", error);
      }

      return;
    }
    const baseLocation =
      originCoordinates.latitude !== 0 && originCoordinates.longitude !== 0
        ? originCoordinates
        : currentLoc;
    const nearbyDrivers: (User & { distance: number })[] = [];
    users.forEach((userData) => {
      if (userData.role && userData.role.toLowerCase() === "driver") {
        const distance = getDistance(
          {
            latitude: baseLocation.latitude,
            longitude: baseLocation.longitude,
          },
          { latitude: userData.latitude, longitude: userData.longitude }
        );
        console.log(
          `Driver ${userData.username} (${userData.uuid}) cách ${distance} mét`
        );
        if (distance <= radius) {
          nearbyDrivers.push({ ...userData, distance });
        }
      }
    });
    nearbyDrivers.sort((a, b) => a.distance - b.distance);
    // Lọc ra những driver chưa nhận request
    const newDrivers = nearbyDrivers.filter(
      (driver) => !attemptedDriversRef.current.has(driver.uuid)
    );
    console.log(`RequestId: ${reqId}`);
    if (newDrivers.length > 0 && reqId) {
      newDrivers.forEach((driver) => {
        attemptedDriversRef.current.add(driver.uuid);
        publishRescueRequest(driver.uuid, reqId);
      });
      console.log(
        `Đã gửi request cho các driver trong bán kính ${radius} mét: ${newDrivers.map((d) => d.uuid)}`
      );
      // Đặt timeout và lưu ID vào ref
      setTimeout(() => {
        // Kiểm tra lại ngay trong callback nếu việc tìm kiếm đã bị hủy
        if (!isSearchingRef.current) {
          setSelectedVehicleId("");
          console.log("Search has been canceled (in callback). Exiting.");
          // handleCancelSearch();
          return;
        }
        if (
          acceptedRequestRef.current.id === reqId &&
          acceptedRequestRef.current.status !== "Pending"
        ) {
          console.log(
            "Driver đã chấp nhận request, dừng tìm kiếm (trong callback)."
          );
          return;
        }
        if (acceptedRequestRef.current.status === "Pending") {
          if (radius <= MAX_RADIUS) {
            sendRideRequestToDrivers(radius + 2000, reqId);
          }
        }
      }, 20000);
    } else {
      console.log(`Không tìm thấy driver mới trong bán kính ${radius} mét.`);
      const newRadius = radius + 2000;
      // Kiểm tra lại trạng thái trước khi gọi đệ quy
      if (acceptedRequestRef.current.id === reqId && acceptedRequestRef.current.status !== "Pending") {
        setSelectedVehicleId("");
        console.log("Driver đã chấp nhận, dừng tìm kiếm.");
        return;
      }
      // Trước khi đệ quy, kiểm tra ngay trạng thái tìm kiếm
      if (!isSearchingRef.current) {
        setSelectedVehicleId("");
        console.log("Search has been canceled. Exiting.");
        // handleCancelSearch();
        try {
          // Gọi trực tiếp API để cancel request
          const result = await updateRequestStatus(reqId, token, "Cancel");
          console.log("Đã hủy request thành công:", result);
        } catch (error) {
          console.error("Lỗi khi tự động hủy request:", error);
        }

        return;
        // return;
      }
      // if (newRadius <= MAX_RADIUS) {
      setTimeout(() => {
        // Kiểm tra lại trước khi gọi đệ quy trong callback
        if (!isSearchingRef.current) {
          console.log(
            "Search has been canceled (in recursion callback). Exiting."
          );
          handleCancelSearch();
          return;
        }
        sendRideRequestToDrivers(newRadius, reqId);
      }, 5000);
    }
  };

  // Bắt đầu tìm tài xế
  const handleFindDriver = async () => {
    if ( !selectedVehicleId) {
      setShowVehicleAlert(true);
      return;
    }
    const reqId = await handleCreateRequest();
    if (!reqId) return;
    setRequestDetailId(reqId);
    isSearchingRef.current = true;
    setIsSearching(true);
    sendRideRequestToDrivers(INITIAL_RADIUS, reqId);
  };

  // Hủy yêu cầu
  const handleCancel = async () => {
    setSelectedVehicleId("");
    if (!requestDetailId) return;
    try {
      await updateRequestStatus(requestDetailId, token, "Cancel");
      if (paymentMethod === "Zalopay" && zpTransId) {
        await refundTransaction(zpTransId, "User canceled request", fare);
        const payZaloEmitter = new NativeEventEmitter(PayZaloBridge);
        const subscription = payZaloEmitter.addListener(
          "EventPayZalo",
          async (data: PayZaloEventData) => {
            subscription.remove();
          }
        );
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  // Hủy tìm kiếm
  const handleCancelSearch = async (reqId?: string) => {
    setSelectedVehicleId("");
    isSearchingRef.current = false;
    setIsSearching(false);
    setShowActionsheet(true);
    setShowTracking(false);
    const idToCancel = reqId || requestDetailId;
    if (idToCancel) {
      try {
        await updateRequestStatus(idToCancel, token, "Cancel");
        handleCancel();
        if (paymentMethod === "Zalopay" && zpTransId) {
          await refundTransaction(zpTransId, "User canceled request", fare);
        }
      } catch (error) {
        console.error("Error cancelling search:", error);
      }
    }
  };

  // Cập nhật vị trí qua PubNub
  const updateLocation = async (locationSubscription: any) => {
    if ((await requestLocationPermission()) && userId) {
      const location = await getCurrentLocation();
      if (!location?.coords) return;
      setCurrentLoc({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setOriginCoordinates((prev) => {
        if (prev.latitude === 0 && prev.longitude === 0) {
          return location.coords;
        }
        return prev;
      });
      publishLocation(
        userId,
        user,
        location.coords.latitude,
        location.coords.longitude
      );
      locationSubscription = await watchLocation((position: any) => {
        setCurrentLoc(position.coords);
        publishLocation(
          userId,
          user,
          position.coords.latitude,
          position.coords.longitude
        );
      });
    }
  };

  useEffect(() => {
    let locationSubscription: any;
    updateLocation(locationSubscription);
    const intervalId = setInterval(
      () => updateLocation(locationSubscription),
      10000
    );
    return () => {
      clearInterval(intervalId);
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  // PubNub subscriptions
  const [users, setUsers] = useState(new Map<string, User>());
  useEffect(() => {
    subscribeToChannel(
      user,
      (msg: any) => {
        const message = msg.message;
        if (msg.publisher === userId || message.role === "Driver") {
          setUsers((prev) => new Map(prev).set(msg.publisher, msg.message));
        }
      },
      (event: any) => {
        if (event.action === "leave" || event.action === "timeout") {
          setUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(event.uuid);
            return updated;
          });
        }
      }
    );
    subscribeToRescueChannel((msg: any) => {
      if (
        msg?.message?.senderRole === "Driver" &&
        msg?.message?.reqStatus === "Accepted"
      ) {
        setAcceptedReqDetStatus(msg.message.reqStatus);
        setAcceptedReqDetId(msg.message.requestDetailId);
        setAcceptedDriverId(msg?.publisher);
        createDirectChannel(msg?.publisher, msg.message.requestDetailId);
      }
    });
    return () => {};
  }, []);

  useEffect(() => {
    hereNow();
  }, []);

  return (
    <Box className="flex-1">
      {/* Header & Back button */}
      <Box className="absolute top-4 left-4 z-20">
        <BackButton onPress={() => router.navigate("/user/customer/home/servicePackage")} />
      </Box>

      {/* Input container with enhanced styling */}
      <Box className="absolute top-0 left-0 w-full z-10 px-4 pt-16">
        <Box className="bg-white/95 rounded-xl p-3 shadow-md">
          {/* Origin search with improved UI */}
          <SearchInput
            value={originQuery}
            onChangeText={handleOriginChange}
            placeholder="Vui lòng nhập điểm đón"
            onClear={() => setOriginQuery("")}
          />

          {/* Search results */}
          <SearchResults
            data={originResults}
            onSelectItem={(item) => {
              setOriginQuery(item.description);
              handleFetchOriginLocation(item.description);
            }}
            visible={originResults.length > 0 && !originSelected}
          />

          {/* StationSelect with improved UI */}
          <Box className="mt-3">
            <StationSelect
              onSelectStation={handleStationSelect}
              currentLocation={currentLoc}
              maxDistance={SERVICE_STATION_RADIUS}
              stations={stations}
              selectedStationId={selectedStationId}
            />
          </Box>
        </Box>
      </Box>

      {/* Map with enhanced markers */}
      <Box className="flex-1">
        <MapViewComponent
          users={users}
          currentLoc={currentLoc}
          isActionSheetOpen={showActionsheet}
          focusMode={[true, () => { }]}
        >
          {originCoordinates.latitude !== 0 && (
            <MapboxGL.Camera
              ref={camera}
              centerCoordinate={[
                originCoordinates.longitude,
                originCoordinates.latitude,
              ]}
            />
          )}

          {/* Current location puck */}
          {currentLoc.latitude !== 0 && (
            <Box className="items-center justify-center">
              <MapboxGL.LocationPuck
                pulsing="default"
                puckBearingEnabled
                puckBearing="course"
                key="current-location"
                visible
              />
            </Box>
          )}

          {/* Origin marker with 2.5D effect */}
          {originCoordinates.latitude !== 0 && (
            <MapboxGL.MarkerView
              id="origin-marker"
              coordinate={[originCoordinates.longitude, originCoordinates.latitude]}
            >
              <Box className="items-center justify-center">
                <OriginMarker size={32} />
              </Box>
            </MapboxGL.MarkerView>
          )}

          {/* Destination marker with 2.5D effect */}
          {destinationCoordinates.latitude !== 0 && (
            <MapboxGL.MarkerView
              id="destination-marker"
              coordinate={[destinationCoordinates.longitude, destinationCoordinates.latitude]}
            >
              <Box className="items-center justify-center">
                <DestinationMarker size={32} />
              </Box>
            </MapboxGL.MarkerView>
          )}

          {/* Station markers */}
          {renderStationMarkers(stations, currentLoc, SERVICE_STATION_RADIUS)}

          {/* Route line */}
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
                style={{
                  lineColor: "#3B82F6",
                  lineWidth: 4,
                  lineCap: "round",
                  lineJoin: "round"
                }}
              />
              {/* Add a glow effect for 3D look */}
              <MapboxGL.LineLayer
                id="routeGlow"
                style={{
                  lineColor: "#93C5FD",
                  lineWidth: 8,
                  lineBlur: 2,
                  lineCap: "round",
                  lineJoin: "round",
                  lineOpacity: 0.4
                }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapViewComponent>
      </Box>

      {/* Action Sheets */}
      {showActionsheet && directionsInfo && (
        <TripDetailsActionSheet
          isOpen={showActionsheet}
          onClose={() => setShowActionsheet(false)}
          onPayment={paymentMethod === "Tiền mặt" ? handleFindDriver : handlePayment}
          onCancelSearch={handleCancelSearch}
          fare={fare}
          fareLoading={fareLoading}
          paymentLoading={paymentLoading}
          isSearching={isSearching}
          directionsInfo={directionsInfo}
          paymentMethodState={[paymentMethod, setPaymentMethod]}
          selectVehicleState={[selectedVehicleId, setSelectedVehicleId]}
          confirmDisabled={!isLocationValid()}
          rescueType="emergency" />
      )}

      {showTracking && requestDetailId && acceptedReqDetId && acceptedReqDetStatus !== "Pending" && (
        <TrackingActionSheet
          isOpen={showTracking}
          onClose={() => setShowTracking(false)}
          requestdetailid={requestDetailId}
          eta={directionsInfo?.distance?.text}
          distance={directionsInfo?.duration?.text}
          driverId={acceptedDriverId}
          setAcceptedReqDetStatus={setAcceptedReqDetStatus}
        />
      )}

      {/* Action sheet toggle buttons */}

      {/* <ActionSheetToggle
    onPress={() => setShowTracking(true)}
    visible={!!(!showActionsheet && directionsInfo)}   /> */}
      {!showActionsheet && directionsInfo && (
        <ActionSheetToggle
          onPress={() => setShowActionsheet(true)}
          visible={!showActionsheet && directionsInfo}
        />

      )}
      {!showTracking && requestDetailId && acceptedReqDetId && acceptedReqDetStatus !== "Pending" && (
        // <Pressable
        //   onPress={() => setShowTracking(true)}
        //   className="absolute bottom-20 right-2 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
        // >
        //   <ChevronUp size={24} color="#3B82F6" />
        // </Pressable>
        <ActionSheetToggle
          onPress={() => setShowTracking(true)}
          visible={!!(!showActionsheet && directionsInfo)} />
      )}
        <VehicleAlertDialog
        isOpen={showVehicleAlert}
        onClose={() => setShowVehicleAlert(false)}
      />
    </Box>
  );
};

export default EmergencyRescueMapScreen;
