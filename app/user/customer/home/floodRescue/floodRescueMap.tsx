import { AuthContext } from "@/app/context/AuthContext";
import { useCameraZoom } from "@/app/hooks/useCameraZoom";
import {
  createFloodRescueRequest,
  createPayment,
  createTransaction,
  FloodRescueRequestPayload,
  updateRequestStatus
} from "@/app/services/beAPI";
import {
  geocodeAddress,
  getAutocomplete,
  getDirections,
  getReverseGeocode,
} from "@/app/services/goongAPI";
import { decodePolyline } from "@/app/utils/utils";
import TrackingActionSheet from "@/components/custom/TrackingActionSheet";
import TripDetailsActionSheet from "@/components/custom/TripDetailsActionSheet";
import { Box } from "@/components/ui/box";
import MapboxGL from "@rnmapbox/maps";
import { router } from "expo-router";
import { getDistance } from "geolib";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  NativeEventEmitter,
  NativeModules
} from "react-native";
// Các import liên quan đến PubNub và Payment
import { useSmoothedLocation } from "@/app/hooks/useUpdateLocation";
import { usePubNubService } from "@/app/services/pubnubService"; // ✅ Use the custom hook
import {
  PayZaloEventData,
  processPayment,
  refundTransaction,
} from "@/app/utils/payment";
import { decodedToken } from "@/app/utils/utils";
import { OriginMarker } from "../../../../../components/custom/CustomMapMarker";
import { ActionSheetToggle, BackButton, SearchInput, SearchResults } from "../../../../../components/custom/MapUIComponents";
import MapViewComponent from "../../../../../components/custom/MapViewComponent";
import { RequestDetail, User } from "../../../../context/formFields";
import { useLatReqDetStore } from "@/app/hooks/useLatReqDetStore";
import axios from "axios";
const { EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } = process.env;
MapboxGL.setAccessToken(`${EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`);
const INITIAL_RADIUS = 1000; // 1 km
const MAX_RADIUS = 5000; // 5 km
// Các hằng số cảnh báo khoảng cách (đơn vị mét)
const MAX_WARN_PICKUP_DISTANCE = 500; // 500m cho điểm đón
const MAX_WARN_DESTINATION_DISTANCE = 10000; // 10 km cho điểm đến
const FloodRescueMapScreen = () => {
  const {
    publishRescueRequest,
    subscribeToChannel,
    subscribeToRescueChannel,
    hereNow,
    createDirectChannel,
  } = usePubNubService();
  const { user, token } = useContext(AuthContext);
  const { PayZaloBridge } = NativeModules;
  const userId = decodedToken(token)?.id;
  // Các state chính
  const {
    latestRequestDetail,
  } = useLatReqDetStore();

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
  // const [destinationCoordinates, setDestinationCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [originQuery, setOriginQuery] = useState("");
  // const [destinationQuery, setDestinationQuery] = useState("");
  const [originResults, setOriginResults] = useState<any[]>([]);
  // const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    []
  );
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);
  const [fare] = useState<number>(0);
  // const [fareLoading, setFareLoading] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [originSelected, setOriginSelected] = useState(false);
  // const [destinationSelected, setDestinationSelected] = useState(false);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [showTracking2, setShowTracking2] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  // const [showCountdownSheet, setShowCountdownSheet] = useState(false);
  const [requestDetailId, setRequestDetailId] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  // const [countdown, setCountdown] = useState(10);
  const [zpTransId, setZpTransId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  // const [isCancel, setIsCancel] = useState(false);
  // const [sentDriverIds, setSentDriverIds] = useState<Set<string>>(new Set());
  const [acceptedReqDetId, setAcceptedReqDetId] = useState<string>();
  const [acceptedReqDetStatus, setAcceptedReqDetStatus] =
    useState<string>("Pending");
  // Flag đánh dấu nếu có driver chấp nhận request
  const [driverAccepted, setDriverAccepted] = useState(false);
  const attemptedDriversRef = useRef<Set<string>>(new Set());
  const [acceptedDriverId, setAcceptedDriverId] = useState<string | null>(null);
  const [requestActive, setRequestActive] = useState<boolean>(false);
  // const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // State để lưu vehicle id đã chọn
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const isSearchingRef = useRef(isSearching);
  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  // PubNub
  const [users, setUsers] = useState(new Map<string, User>());
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
  // Hàm xử lý khi fetch địa chỉ từ geocode
  const handleFetchLocation = async (address: string, isOrigin: boolean) => {
    const result = await geocodeAddress(address);
    if (result) {
      const { lat, lng } = result;
      if (isOrigin) {
        // Kiểm tra khoảng cách giữa vị trí hiện tại và điểm đón mới
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
      } else {
        // Kiểm tra khoảng cách giữa điểm đón và điểm đến mới
        if (
          originCoordinates.latitude !== 0 &&
          originCoordinates.longitude !== 0
        ) {
          const distance = getDistance(originCoordinates, {
            latitude: lat,
            longitude: lng,
          });
          if (distance > MAX_WARN_DESTINATION_DISTANCE) {
            Alert.alert(
              "Điểm đến quá xa",
              "Điểm đến bạn chọn quá xa so với điểm đón. Vui lòng chọn lại điểm đến hợp lý hơn."
            );
            return;
          }
        }

      }
      camera.current?.flyTo([lng, lat, 1000]);
    }
  };

  const handleOriginChange = (text: string) => {
    setOriginQuery(text);
    setOriginSelected(false);
  };

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



  // Hàm kiểm tra hợp lệ vị trí (cho nút confirm)
  const isLocationValid = () => {
    if (originCoordinates.latitude === 0) return false;
    if (currentLoc.latitude !== 0 && currentLoc.longitude !== 0) {
      const distanceFromCurrent = getDistance(currentLoc, originCoordinates);
      if (distanceFromCurrent > MAX_WARN_PICKUP_DISTANCE) return false;
    }
    const distanceOriginToDest = getDistance(
      originCoordinates,
      originCoordinates
    );
    if (distanceOriginToDest > MAX_WARN_DESTINATION_DISTANCE) return false;
    return true;
  };
  // Tạo yêu cầu cứu hộ
  const handleCreateRequest = async () => {
    attemptedDriversRef.current = new Set();
    if (!token) return;

    const payload: FloodRescueRequestPayload = {
      pickuplong: originCoordinates.longitude,
      pickuplat: originCoordinates.latitude,
      pickuplocation: originQuery,
      totalprice: 0,
    };
    try {
      const result = await createFloodRescueRequest(payload, token);
      console.log(result);
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
      // setShowCountdownSheet(true);
      setRequestDetailId(result.requestdetailid);
      console.log("REQUEST DETAIL ID: " + result.requestdetailid);
      return result.requestdetailid;
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  const fetchRequestDetail = async (reqDetID: string) => {
    const response = await axios.get<RequestDetail>(
      `https://motor-save-be.vercel.app/api/v1/requests/driver/${reqDetID}`,
      { headers: { Authorization: "Bearer " + token } }
    );
    setOriginCoordinates({
      longitude: response.data?.pickuplong || 0,
      latitude: response.data?.pickuplat || 0
    });
    setOriginQuery(response.data?.pickuplocation);
    setOriginSelected(true);
    setAcceptedDriverId(response.data?.driverid)
    setAcceptedReqDetStatus(response.data?.requeststatus);
    console.log("Fetching request detail...");
  };

  const handlePayment = async () => {
    const callbackUrl = "myapp://user/customer/home/floodRescue/floodRescueMap";
    if (!token) return;
    setPaymentLoading(true);
    const payload: FloodRescueRequestPayload = {
      pickuplong: originCoordinates.longitude,
      pickuplat: originCoordinates.latitude,
      pickuplocation: originQuery,
      totalprice: fare || 0,
    };
    try {
      const result = await createFloodRescueRequest(payload, token);
      console.log(result);
      const reqId = result.requestdetailid;
      setRequestDetailId(reqId);
      setShowActionsheet(true);
      processPayment(fare, callbackUrl);
      const payZaloEmitter = new NativeEventEmitter(PayZaloBridge);
      const subscription = payZaloEmitter.addListener(
        "EventPayZalo",
        async (data: PayZaloEventData) => {
          if (data.returnCode === "1") {
            // router.navigate("/user/customer/home/normalRescue/rescueMap");
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
              if (transactionResponse) {
                // handleRequestSuccess(reqId);
                isSearchingRef.current = true;
                setIsSearching(true);
                setDriverAccepted(false);
                sendRideRequestToDrivers(INITIAL_RADIUS, reqId);
              }
              console.log("Transaction created:", transactionResponse);
            } catch (error) {
              console.error("Error creating transaction:", error);
            }
            // Manually trigger deep link navigation
            // Linking.openURL("myapp://user/customer/home/normalRescue/rescueMap");
          } else {
            // router.navigate("/user/customer/home/normalRescue/rescueMap");
            alert("Payment failed! Return code: " + data.returnCode);
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

  // 1. Tạo ref để lưu trạng thái request được driver chấp nhận
  const acceptedRequestRef = useRef<{ id: string | null; status: string }>({
    id: null,
    status: "Pending",
  });

  // 2. Cập nhật ref khi acceptedReqDetId hoặc acceptedReqDetStatus thay đổi
  useEffect(() => {
    acceptedRequestRef.current = {
      id: acceptedReqDetId ?? null,
      status: acceptedReqDetStatus,
    };
    // Nếu có driver chấp nhận thì update UI ngay
    if (acceptedReqDetId && acceptedReqDetStatus !== "Pending") {
      setShowActionsheet(false);
      setIsSearching(false);
      setShowTracking(true);
      console.log("Driver đã chấp nhận request, cập nhật UI và dừng tìm kiếm.");
    }
  }, [acceptedReqDetId, acceptedReqDetStatus]);

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
        console.log("Driver đã chấp nhận, dừng tìm kiếm.");
        return;
      }
      // Trước khi đệ quy, kiểm tra ngay trạng thái tìm kiếm
      if (!isSearchingRef.current) {
        console.log("Search has been canceled. Exiting.");
        // handleCancelSearch();
        return;
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

  const handleFindDriver = async () => {
    const reqId = await handleCreateRequest();
    if (!reqId) {
      console.log("Không thể tạo request");
      return;
    }

    console.log("Lưu reqId vào state:", reqId);
    // Đảm bảo requestDetailId được cập nhật
    setRequestDetailId(reqId);

    // Đặt trạng thái tìm kiếm
    isSearchingRef.current = true;
    setIsSearching(true);
    setDriverAccepted(false);

    // Truyền reqId trực tiếp vào hàm tìm kiếm

    // Truyền reqId trực tiếp vào hàm tìm kiếm
    sendRideRequestToDrivers(INITIAL_RADIUS, reqId);
  };

  const handleCancel = async () => {
    console.log("handleCancel được gọi với requestDetailId:", requestDetailId);

    if (!requestDetailId) {
      console.log("requestDetailId không tồn tại, không thể hủy");
      return;
    }

    try {
      console.log("Đang hủy request với ID:", requestDetailId);
      const result = await updateRequestStatus(
        requestDetailId,
        token,
        "Cancel"
      );
      console.log("Kết quả hủy request:", result);

      if (paymentMethod === "Zalopay" && zpTransId) {
        console.log("Đang hoàn tiền cho giao dịch:", zpTransId);
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

      console.log("Request đã được hủy thành công");
      // Cập nhật UI nếu cần

      setShowActionsheet(false);
      setRequestActive(false);
    } catch (error) {
      console.error("Lỗi chi tiết khi hủy request:", error);
      // Xử lý lỗi (có thể thử hủy lại hoặc hiển thị thông báo)
    }
  };

  const handleCancelSearch = async (reqId?: string) => {
    console.log("handleCancelSearch được gọi");

    // Ngay lập tức đặt trạng thái tìm kiếm về false
    isSearchingRef.current = false;
    setIsSearching(false);

    // Cập nhật UI
    setShowActionsheet(true);
    setShowTracking(false);

    // Sử dụng reqId được truyền vào nếu có, nếu không thì dùng state
    const idToCancel = reqId || requestDetailId;

    if (idToCancel) {
      console.log("Đang gọi handleCancel với requestDetailId:", idToCancel);
      try {
        // Gọi trực tiếp hàm cancel với ID
        await updateRequestStatus(idToCancel, token, "Cancel");
        console.log("Đã hủy request thành công với ID:", idToCancel);
        handleCancel();
        // Xử lý hoàn tiền nếu cần
        if (paymentMethod === "Zalopay" && zpTransId) {
          await refundTransaction(zpTransId, "User canceled request", fare);
        }
      } catch (error) {
        console.error("Lỗi khi hủy request:", error);
      }
    } else {
      console.log("Không có requestDetailId để hủy");
    }
  };
  // --- PubNub Integration ---

  useEffect(() => {
    subscribeToChannel(
      user,
      (msg: any) => {
        const message = msg.message;
        if (msg.publisher === userId || message.role === "Driver") {
          setUsers((prev) => {
            const updatedMap = new Map(prev);
            updatedMap.set(msg.publisher, msg.message);
            return acceptedDriverId
              ? new Map(
                [...updatedMap].filter(([key]) => key === acceptedDriverId)
              )
              : updatedMap;
          });
        }
      },
      (event: any) => {
        if (event.action === "leave" || event.action === "timeout") {
          setUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(event.uuid);
            return acceptedDriverId
              ? new Map(
                [...updated].filter(([key]) => key === acceptedDriverId)
              )
              : updated;
          });
        }
      }
    );

    subscribeToRescueChannel((msg: any) => {
      if (
        // msg?.message?.requestDetailId === requestDetailId
        msg?.message?.senderRole === "Driver"
        && msg?.message?.reqStatus === "Accepted"
      ) {
        console.log(msg);
        setAcceptedReqDetStatus(msg.message.reqStatus);
        setAcceptedReqDetId(msg.message.requestDetailId);
        console.log(
          "Driver has accept the requet: " + msg.message.requestDetailId
        );
        setAcceptedDriverId(msg?.publisher);
        createDirectChannel(msg?.publisher, msg.message.requestDetailId);

        //Hide input field
        setRequestActive(true);
      }
    });
    return () => {
      // pubnub?.unsubscribeAll();
      // pubnub?.destroy();
    };
  }, []);
  useEffect(() => {
    if (latestRequestDetail &&
      latestRequestDetail?.requeststatus !== "Done" &&
      latestRequestDetail?.requeststatus !== "Cancel") {
      setRequestDetailId(latestRequestDetail?.requestdetailid)
      fetchRequestDetail(latestRequestDetail?.requestdetailid)
      setShowTracking(true);
      setRequestActive(true);
    }
    hereNow();
  }, []);

  // useEffect(() => {
  //   if (acceptedDriverId && users.size > 0) {
  //     if (
  //       (latestRequestDetail &&
  //         latestRequestDetail?.requeststatus !== "Done" &&
  //         latestRequestDetail?.requeststatus !== "Cancel")
  //     ) {
  //       if (originSelected && originCoordinates.latitude) {
  //         const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
  //         const driverLoc = `${users.get(acceptedDriverId)?.latitude},${users.get(acceptedDriverId)?.longitude}`;
  //         console.log("Calculating direction..");
  //         getDirections(originStr, driverLoc)
  //           .then((data) => {
  //             if (data.routes && data.routes.length > 0) {
  //               const encodedPolyline = data.routes[0].overview_polyline.points;
  //               const decoded = decodePolyline(encodedPolyline);
  //               setRouteCoordinates(decoded);
  //               if (data.routes[0].legs && data.routes[0].legs.length > 0) {
  //                 setDirectionsInfo(data.routes[0].legs[0]);
  //               }
  //             } else {
  //               console.log("No routes found:", data);
  //             }
  //           })
  //           .catch((error) => console.error("Error fetching directions:", error));
  //       }
  //     }
  //   }
  // }, [originCoordinates, originSelected]);


  // useEffect(() => {
  //   if (acceptedDriverId && users.size > 0) {
  //     if (
  //       (latestRequestDetail &&
  //         latestRequestDetail?.requeststatus !== "Done" &&
  //         latestRequestDetail?.requeststatus !== "Cancel")
  //     ) {
  //       if (originSelected && originCoordinates.latitude) {
  //         const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
  //         const driverLoc = `${users.get(acceptedDriverId)?.latitude},${users.get(acceptedDriverId)?.longitude}`;
  //         console.log("adsadadsasd"+acceptedDriverId)
  //         console.log("Calculating direction..");
  //         getDirections(originStr, driverLoc)
  //           .then((data) => {
  //             if (data.routes && data.routes.length > 0) {
  //               const encodedPolyline = data.routes[0].overview_polyline.points;
  //               const decoded = decodePolyline(encodedPolyline);
  //               setRouteCoordinates(decoded);
  //               if (data.routes[0].legs && data.routes[0].legs.length > 0) {
  //                 setDirectionsInfo(data.routes[0].legs[0]);
  //               }
  //             } else {
  //               console.log("No routes found:", data);
  //             }
  //           })
  //           .catch((error) => console.error("Error fetching directions:", error));
  //       }
  //     }
  //   }
  // }, [originCoordinates, originSelected]);


  //Fetching route based on driver progress:
  // const fetchRoute = () => {

  //   if (acceptedDriverId && users.size > 0) {

  //     if (originSelected && originCoordinates.latitude) {
  //       const driverLoc = `${users.get(acceptedDriverId)?.latitude},${users.get(acceptedDriverId)?.longitude}`;
  //       const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
  //       // console.log("adsadadsasd"+acceptedDriverId)
  //       // console.log("driver:"+driverLoc);
  //       let startStr = "";
  //       let endStr = "";

  //       if (acceptedReqDetStatus === "Done") return setRouteCoordinates([]);
  //       switch (acceptedReqDetStatus) {
  //         case "Accepted":
  //           startStr = originStr;
  //           endStr = originStr;
  //           break;
  //         case "Pickup":
  //           startStr = driverLoc;
  //           endStr = originStr;
  //           break;
  //         case "Processing":
  //           startStr = driverLoc;
  //           endStr = originStr;
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
    console.log('one')
    if (acceptedDriverId) {
      console.log('two')
      if (
        originSelected &&
        originCoordinates.latitude
      ) {
        console.log('three')
        console.log(users)
        const driverLoc = `${users.get(acceptedDriverId)?.latitude},${users.get(acceptedDriverId)?.longitude}`;
        console.log("hjjjjjjjjjjj" + driverLoc)
        console.log("acceptedDriverId" + acceptedDriverId)
        const originStr = `${originCoordinates.latitude},${originCoordinates.longitude}`;
        let startStr = "";
        let endStr = "";

        if (acceptedReqDetStatus === 'Done') return setRouteCoordinates([]);
        switch (acceptedReqDetStatus) {
          case "Accepted":
            startStr = originStr;
            endStr = driverLoc;
            break;
          case "Pickup":
            startStr = driverLoc;
            endStr = originStr;
            break;
          case "Processing":
            startStr = driverLoc;
            endStr = driverLoc;
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
  //   console.log("adsadadsasdasdasdasd                    "+fetchRoute());
  // }, [currentLoc, acceptedReqDetStatus]);

  useEffect(() => {
    fetchRoute();
  }, [currentLoc, acceptedReqDetStatus, acceptedDriverId]);
  return (
    <Box className="flex-1">
      {/* Back button */}
      {/* <BackButton onPress={() => router.back()} /> */}
      <Box className="absolute top-4 left-4 z-20">
        <BackButton onPress={() => router.back()} />
      </Box>


      {/* Header: Search input & results */}
      <Box className="absolute top-0 left-0 w-full z-10 p-4 pt-16">
        {!requestActive && (
          <>
            <SearchInput
              value={originQuery}
              onChangeText={handleOriginChange}
              placeholder="Vui lòng nhập điểm đón"
              onClear={() => setOriginQuery("")}
            />
            <SearchResults
              data={originResults}
              onSelectItem={(item) => {
                setOriginQuery(item.description);
                handleFetchLocation(item.description, true);
              }}
              visible={originResults.length > 0 && !originSelected}
            />
          </>
        )}
      </Box>

      {/* Map view */}
      <Box className="flex-1">
        <MapViewComponent
          users={users}
          currentLoc={currentLoc}
          isActionSheetOpen={showActionsheet}
          focusMode={[focusOnMe, setFocusOnMe]}
          role="Customer"
          userId={users.get(userId ?? '')?.uuid || ''}
        >
          {originCoordinates.latitude !== 0 && (
            <MapboxGL.Camera
              ref={camera}
            // centerCoordinate={[originCoordinates.longitude, originCoordinates.latitude]}
            />
          )}
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
          {originCoordinates.latitude !== 0 && (
            <MapboxGL.MarkerView
              id="origin-marker"
              coordinate={[originCoordinates.longitude, originCoordinates.latitude]}
            >
              <OriginMarker size={32} />
            </MapboxGL.MarkerView>
          )}
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

      {/* Trip details action sheet */}
      {requestActive || (showActionsheet && !acceptedReqDetId) && (
        <TripDetailsActionSheet
          isOpen={showActionsheet}
          onClose={() => setShowActionsheet(false)}
          onPayment={
            paymentMethod === "Tiền mặt" ? handleFindDriver : handlePayment
          }
          onCancelSearch={handleCancelSearch}
          fare={fare}
          fareLoading={false}
          paymentLoading={paymentLoading}
          isSearching={isSearching}
          directionsInfo={null}
          paymentMethodState={[paymentMethod, setPaymentMethod]}
          selectVehicleState={[selectedVehicleId, setSelectedVehicleId]}
          confirmDisabled={!isLocationValid()}
          rescueType="flood"
        />
      )}

      {/* Tracking action sheet */}
      {(showTracking2 && latestRequestDetail &&
        latestRequestDetail?.requeststatus !== "Done" &&
        latestRequestDetail?.requeststatus !== "Cancel") ?
        <>
          {requestDetailId && (
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
        :
        <>
          {showTracking && requestDetailId && acceptedReqDetId && acceptedReqDetStatus !== "Pending" && (
            <TrackingActionSheet
              isOpen={showTracking}
              onClose={() => setShowTracking(false)}
              // requestdetailid={requestDetailId}
              eta={directionsInfo?.duration?.text}
              distance={directionsInfo?.distance?.text}
              driverId={acceptedDriverId}
              setAcceptedReqDetStatus={setAcceptedReqDetStatus}
              requestDetailIdState={[requestDetailId, setRequestDetailId]}
            />
          )}
        </>
      }

      {/* Action sheet toggle buttons */}
      {!showActionsheet && currentLoc.latitude != 0 && (
        <ActionSheetToggle
          onPress={() => setShowActionsheet(true)}
          visible={!showActionsheet}
        />
      )}
      {!showTracking && requestDetailId && acceptedReqDetId && acceptedReqDetStatus !== "Pending" && (
        <ActionSheetToggle
          onPress={() => setShowTracking(true)}
          visible={true}
        />
      )}
      {latestRequestDetail &&
        (latestRequestDetail?.requeststatus !== "Done" &&
        latestRequestDetail?.requeststatus !== "Cancel") &&
        <ActionSheetToggle
          onPress={() => setShowTracking2(true)}
          visible={true}
        />
      }
    </Box>
  );

};

export default FloodRescueMapScreen;
