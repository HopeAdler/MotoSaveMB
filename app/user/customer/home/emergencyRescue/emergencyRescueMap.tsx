import { AuthContext } from "@/app/context/AuthContext";
import { useCameraZoom } from "@/app/hooks/useCameraZoom";
import { useSmoothedLocation } from "@/app/hooks/useUpdateLocation";
import beAPI, {
  calculateFare,
  createEmergencyRescueRequest,
  createPayment,
  createTransaction,
  EmergencyRescueRequestPayload,
  getServicePackageByName,
  ServicePackage,
  updatePaymentStatus,
  updateRequestStatus,
} from "@/app/services/beAPI";
import {
  geocodeAddress,
  getAutocomplete,
  getDirections,
  getReverseGeocode,
} from "@/app/services/goongAPI";
import { usePubNubService } from "@/app/services/pubnubService";
import {
  PayZaloEventData,
  processPayment,
  refundTransaction,
} from "@/app/utils/payment";
import { decodedToken, decodePolyline } from "@/app/utils/utils";
import {
  DestinationMarker,
  OriginMarker,
  renderStationMarkers,
} from "@/components/custom/CustomMapMarker";
import StationSelect, { Station } from "@/components/custom/StationSelect";
import TrackingActionSheet from "@/components/custom/TrackingActionSheet";
import TripDetailsActionSheet from "@/components/custom/TripDetailsActionSheet";
import { Box } from "@/components/ui/box";
import MapboxGL from "@rnmapbox/maps";
import { router } from "expo-router";
import { getDistance } from "geolib";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, NativeEventEmitter, NativeModules } from "react-native";
import {
  ActionSheetToggle,
  BackButton,
  SearchInput,
  SearchResults,
} from "../../../../../components/custom/MapUIComponents";
import MapViewComponent from "../../../../../components/custom/MapViewComponent";
import VehicleAlertDialog from "../../../../../components/custom/VehicleAlertDialog";
import { RequestDetail, User } from "../../../../context/formFields";
import axios from "axios";
import { useLatReqDetStore } from "@/app/hooks/useLatReqDetStore";

const { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } = process.env;
MapboxGL.setAccessToken(`${EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`);

// Các hằng số
const INITIAL_RADIUS = 5000; // 5 km
const MAX_RADIUS = 15000; // 15 km
const MAX_WARN_PICKUP_DISTANCE = 500; // 500m cho điểm đón
const MAX_WARN_DESTINATION_DISTANCE = 10000; // 10 km cho điểm đến
const SERVICE_STATION_RADIUS = 10000; // 10 km phạm vi phục vụ

const EmergencyRescueMapScreen = () => {
  const {
    // publishLocation,
    publishRescueRequest,
    subscribeToChannel,
    subscribeToRescueChannel,
    hereNow,
  } = usePubNubService();
  const { user, token } = useContext(AuthContext);
  const { PayZaloBridge } = NativeModules;
  const userId = decodedToken(token)?.id;

  // Các state chính
  const [focusOnMe, setFocusOnMe] = useState<boolean>(true);
  const currentLoc = useSmoothedLocation();
  const [originCoordinates, setOriginCoordinates] = useState({
    latitude: 0,
    longitude: 0,
  });
  useEffect(() => {
    // if origin is still at the default, and currentLoc is now non-zero, set it:
    if (
      originCoordinates.latitude === 0 &&
      originCoordinates.longitude === 0 &&
      currentLoc.latitude !== 0 &&
      currentLoc.longitude !== 0
    ) {
      setOriginCoordinates(currentLoc);
    }
  }, [currentLoc, originCoordinates]);
  const [servicePackage, setServicePackage] = useState<ServicePackage>();
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
  const [fare, setFare] = useState<number>(0);
  const [fareLoading, setFareLoading] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [originSelected, setOriginSelected] = useState(false);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [requestDetailId, setRequestDetailId] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [showTracking2, setShowTracking2] = useState(false);
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
  const [requestActive, setRequestActive] = useState<boolean>(false);
  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  const fetchServicePackage = async () => {
    const results = await getServicePackageByName("Cứu hộ đến trạm");
    setServicePackage(results);
  };

  // State để lưu station đã chọn (ID)
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const [selectedStationAddress, setSelectedStationAddress] =
    useState<string>("");
  // State để lưu vehicle id đã chọn
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  // State để lưu danh sách station (fetch qua beAPI)
  const [stations, setStations] = useState<Station[]>([]);

  const { latestRequestDetail } = useLatReqDetStore();

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

  // Fetch latest request detail
  const fetchRequestDetail = async (reqDetID: string) => {
    const response = await axios.get<RequestDetail>(
      `https://motor-save-be.vercel.app/api/v1/requests/driver/${reqDetID}`,
      { headers: { Authorization: "Bearer " + token } }
    );
    setOriginCoordinates({
      longitude: response.data?.pickuplong || 0,
      latitude: response.data?.pickuplat || 0,
    });
    setDestinationCoordinates({
      longitude: response.data?.deslng || 0,
      latitude: response.data?.deslat || 0,
    });
    setOriginQuery(response.data?.pickuplocation);
    // setStationQuery(response.data?.destination);
    setSelectedStationAddress(response.data?.destination);
    setOriginSelected(true);
    // setDestinationSelected(true);
    setAcceptedDriverId(response.data?.driverid);
    setAcceptedReqDetStatus(response.data?.requeststatus);
    console.log("Fetching request detail...");
  };

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
      if (originQuery?.trim()) {
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
      // selectedStationAddress &&
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

  //Fetching route based on driver progress:
  // const fetchRoute = () => {
  //   if (acceptedDriverId && users.size > 0) {
  //     if (
  //       originSelected &&
  //       originCoordinates.latitude &&
  //       destinationCoordinates.latitude
  //     ) {
  //       const driverLoc = `${users.get(acceptedDriverId)?.latitude},${users.get(acceptedDriverId)?.longitude}`;
  //       const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
  //       const destinationStr = `${destinationCoordinates.latitude},${destinationCoordinates.longitude}`;
  //       let startStr = "";
  //       let endStr = "";

  //       if (acceptedReqDetStatus === 'Done') return setRouteCoordinates([]);
  //       switch (acceptedReqDetStatus) {
  //         case "Accepted":
  //           startStr = originStr;
  //           endStr = destinationStr;
  //           break;
  //         case "Pickup":
  //           startStr = driverLoc;
  //           endStr = originStr;
  //           break;
  //         case "Processing":
  //           startStr = driverLoc;
  //           endStr = destinationStr;
  //           break;
  //       }

  //       getDirections(startStr, endStr)
  //         .then((data: any) => {
  //           if (data.routes && data.routes.length > 0) {
  //             const encodedPolyline = data.routes[0].overview_polyline.points;
  //             const decoded = decodePolyline(encodedPolyline);
  //             setRouteCoordinates(decoded);
  //             if (data.routes[0].legs && data.routes[0].legs.length > 0) {
  //               setDirectionsInfo(data.routes[0].legs[0]);
  //               console.log("Switching route...");
  //             }
  //           } else {
  //             console.log("No routes found:", data);
  //           }
  //         })
  //         .catch((error: any) =>
  //           console.error("Error fetching directions:", error)
  //         );
  //     }
  //   }
  // };
  const fetchRoute = () => {
    console.log("one");
    if (acceptedDriverId) {
      console.log("two");
      if (
        originSelected &&
        selectedStationAddress &&
        // destinationSelected &&
        originCoordinates.latitude &&
        destinationCoordinates.latitude
      ) {
        console.log("three");
        const driverLoc = `${users.get(acceptedDriverId)?.latitude},${users.get(acceptedDriverId)?.longitude}`;
        const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
        const destinationStr = `${destinationCoordinates.latitude},${destinationCoordinates.longitude}`;
        let startStr = "";
        let endStr = "";

        if (acceptedReqDetStatus === "Done") return setRouteCoordinates([]);
        switch (acceptedReqDetStatus) {
          case "Accepted":
            startStr = originStr;
            endStr = destinationStr;
            break;
          case "Pickup":
            startStr = driverLoc;
            endStr = originStr;
            break;
          case "Processing":
            startStr = driverLoc;
            endStr = destinationStr;
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
          .catch((error: any) =>
            console.error("Error fetching directions:", error)
          );
      }
    }
  };
  // useEffect(() => {
  //   fetchRoute();
  // }, [currentLoc, acceptedReqDetStatus]);
  useEffect(() => {
    fetchRoute();
  }, [currentLoc, acceptedReqDetStatus, acceptedDriverId]);
  // Tính toán cước phí khi có thông tin đường đi
  useEffect(() => {
    if (directionsInfo && !showActionsheet && servicePackage) {
      const distanceValue = directionsInfo.distance?.value || 0;
      setFareLoading(true);
      calculateFare(distanceValue, servicePackage?.rate, 0)
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
            const updateRequest = await updateRequestStatus(
              reqId,
              token,
              "Cancel"
            );
            console.log(updateRequest);
            const transactionResponse = await createTransaction(
              {
                requestdetailid: reqId,
                zptransid: data.transactionId || "",
                totalamount: fare,
                paymentmethod: "ZaloPay",
                paymentstatus: "Failed",
              },
              token
            );
            console.log(transactionResponse);
            alert("Thanh toán thất bại! Vui lòng thử lại sau");
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
        "Vui lòng thử lại sau.",
        "Hiện không có tài xế trong phạm vi phục vụ."
      );

      // Đặt UI state
      isSearchingRef.current = false;
      setIsSearching(false);
      setShowActionsheet(true);

      try {
        // Gọi trực tiếp API để cancel request
        const result = await updateRequestStatus(reqId, token, "Cancel");
        if (paymentMethod === "Zalopay" && zpTransId) {
          const payment = await updatePaymentStatus(
            {
              requestDetailId: reqId,
              newStatus: "Refunded",
            },
            token
          );
          console.log(payment);
          console.log("Đã hủy request thành công:", result);
          await refundTransaction(zpTransId, "User canceled request", fare);
          const payZaloBridgeEmitter = new NativeEventEmitter(PayZaloBridge);
          const subscription = payZaloBridgeEmitter.addListener(
            "EventPayZalo",
            async (data: PayZaloEventData) => {
              console.log("Nhận sự kiện PayZalo:", data);
              subscription.remove();
            }
          );
        }
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
      if (
        acceptedRequestRef.current.id === reqId &&
        acceptedRequestRef.current.status !== "Pending"
      ) {
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
    if (!selectedVehicleId) {
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
      setRequestDetailId(null);

      setShowActionsheet(false);
      //Show lại input fields
      setRequestActive(false);
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
        if (paymentMethod === "Zalopay" && zpTransId) {
          await refundTransaction(zpTransId, "User canceled request", fare);
          const payment = await updatePaymentStatus(
            {
              requestDetailId: requestDetailId,
              newStatus: "Refunded",
            },
            token
          );
          console.log(payment);
          Alert.alert("Hoàn tiền", "Bạn đã được hoàn tiền");
          const payZaloBridgeEmitter = new NativeEventEmitter(PayZaloBridge);
          const subscription = payZaloBridgeEmitter.addListener(
            "EventPayZalo",
            async (data: PayZaloEventData) => {
              console.log("Nhận sự kiện PayZalo:", data);
              subscription.remove();
            }
          );
        }
      } catch (error) {
        console.error("Error cancelling search:", error);
      }
    }
  };

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
        msg?.message?.requestDetailId === requestDetailId &&
        msg?.message?.senderRole === "Driver" &&
        msg?.message?.reqStatus === "Accepted"
      ) {
        setAcceptedReqDetStatus(msg.message.reqStatus);
        setAcceptedReqDetId(msg.message.requestDetailId);
        setAcceptedDriverId(msg?.publisher);
        createDirectChannel(msg?.publisher, msg.message.requestDetailId);

        //Hide input fields origin & destination
        setRequestActive(true);
      }
    });
    return () => { };
  }, [requestDetailId]);

  useEffect(() => {
    hereNow();
    fetchServicePackage();
  }, []);

  useEffect(() => {
    if (
      latestRequestDetail &&
      latestRequestDetail?.requeststatus !== "Done" &&
      latestRequestDetail?.requeststatus !== "Cancel"
    ) {
      setRequestDetailId(latestRequestDetail?.requestdetailid);
      fetchRequestDetail(latestRequestDetail?.requestdetailid);
      setShowTracking(true);
      setRequestActive(true);
    }
  }, [latestRequestDetail]);

  return (
    <Box className="flex-1">
      {/* Header & Back button */}
      <Box className="absolute top-4 left-4 z-20">
        <BackButton onPress={() => router.back()} />
      </Box>

      {/* Input container with enhanced styling */}
      <Box className="absolute top-0 left-0 w-full z-10 px-4 pt-16">
        {!requestActive && (
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
        )}
      </Box>

      {/* Map with enhanced markers */}
      <Box className="flex-1">
        <MapViewComponent
          users={users}
          currentLoc={currentLoc}
          isActionSheetOpen={showActionsheet}
          focusMode={[focusOnMe, setFocusOnMe]}
          role={"Customer"}
          userId={users.get(userId ?? "")?.uuid || ""}
        >
          {originCoordinates.latitude !== 0 && <MapboxGL.Camera ref={camera} />}

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
              coordinate={[
                originCoordinates.longitude,
                originCoordinates.latitude,
              ]}
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
              coordinate={[
                destinationCoordinates.longitude,
                destinationCoordinates.latitude,
              ]}
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
              lineMetrics={true}
              shape={{
                type: "Feature",
                geometry: { type: "LineString", coordinates: routeCoordinates },
                properties: {},
              }}
            >
              <MapboxGL.LineLayer
                id="routeLine"
                style={{
                  lineColor: "#fab753",
                  lineWidth: 4,
                  lineOpacity: 1,
                }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapViewComponent>
      </Box>

      {/* Action Sheets */}
      {requestActive ||
        (showActionsheet && directionsInfo && !acceptedReqDetId && (
          <TripDetailsActionSheet
            isOpen={showActionsheet}
            onClose={() => setShowActionsheet(false)}
            onPayment={
              paymentMethod === "Tiền mặt" ? handleFindDriver : handlePayment
            }
            onCancelSearch={handleCancelSearch}
            fare={fare}
            fareLoading={fareLoading}
            paymentLoading={paymentLoading}
            isSearching={isSearching}
            directionsInfo={directionsInfo}
            paymentMethodState={[paymentMethod, setPaymentMethod]}
            selectVehicleState={[selectedVehicleId, setSelectedVehicleId]}
            confirmDisabled={!isLocationValid()}
            rescueType="emergency"
          />
        ))}

      {showTracking2 &&
      latestRequestDetail &&
      latestRequestDetail?.requeststatus !== "Done" &&
      latestRequestDetail?.requeststatus !== "Cancel" ? (
        <>
          {requestDetailId && (
            // setShowTracking2(true),
            <TrackingActionSheet
              isOpen={showTracking2}
              onClose={() => setShowTracking2(false)}
              // requestdetailid={requestDetailId}
              eta={directionsInfo?.duration?.text}
              distance={directionsInfo?.distance?.text}
              driverId={null}
              setAcceptedReqDetStatus={setAcceptedReqDetStatus}
              requestDetailIdState={[requestDetailId, setRequestDetailId]}
            />
          )}
        </>
      ) : (
        <>
          {showTracking &&
            requestDetailId &&
            acceptedReqDetId &&
            acceptedReqDetStatus !== "Pending" && (
              <TrackingActionSheet
                isOpen={showTracking}
                onClose={() => setShowTracking(false)}
                requestDetailIdState={[requestDetailId, setRequestDetailId]}
                eta={directionsInfo?.duration?.text}
                distance={directionsInfo?.distance?.text}
                driverId={acceptedDriverId}
                setAcceptedReqDetStatus={setAcceptedReqDetStatus}
              />
            )}
        </>
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
      {!showTracking &&
        requestDetailId &&
        acceptedReqDetId &&
        acceptedReqDetStatus !== "Pending" && (
          // <Pressable
          //   onPress={() => setShowTracking(true)}
          //   className="absolute bottom-20 right-2 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          // >
          //   <ChevronUp size={24} color="#3B82F6" />
          // </Pressable>
          <ActionSheetToggle
            onPress={() => setShowTracking(true)}
            visible={true}
          />
        )}
      {latestRequestDetail &&
        latestRequestDetail?.requeststatus !== "Done" &&
        latestRequestDetail?.requeststatus !== "Cancel" && (
          <ActionSheetToggle
            onPress={() => setShowTracking2(true)}
            visible={true}
          />
        )}

      <VehicleAlertDialog
        isOpen={showVehicleAlert}
        onClose={() => setShowVehicleAlert(false)}
      />
    </Box>
  );
};

export default EmergencyRescueMapScreen;
