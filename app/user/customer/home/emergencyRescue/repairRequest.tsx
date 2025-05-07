import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import {
  AlertCircle,
  Car,
  CheckCircle2,
  ChevronDownIcon,
  ChevronLeft,
  MessageSquare,
  Phone,
  User,
} from "lucide-react-native";
import axios from "axios";
import AuthContext from "@/app/context/AuthContext";
import { RepairQuote, RepairRequestDetail } from "@/app/context/formFields";
import {
  Alert,
  FlatList,
  NativeEventEmitter,
  NativeModules,
  Pressable,
  ScrollView,
} from "react-native";
import { Input, InputField } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button, ButtonText } from "@/components/ui/button";
import {
  geocodeAddress,
  getAutocomplete,
  getDirections,
} from "@/app/services/goongAPI";
import { decodedToken, formatMoney, handlePhoneCall } from "@/app/utils/utils";
import { PayZaloEventData, processPayment } from "@/app/utils/payment";
import {
  acceptRepairQuote,
  calculateFare,
  cancelRequest,
  createPayment,
  createReturnVehicleRequest,
  createTransaction,
  RescueRequestPayload,
} from "@/app/services/beAPI";
import { RequestContext } from "@/app/context/RequestContext";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { VStack } from "@/components/ui/vstack";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Radio, RadioGroup, RadioLabel } from "@/components/ui/radio";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Divider } from "@/components/ui/divider";
import { Avatar } from "react-native-elements";

const RepairRequestScreen = () => {
  const { PayZaloBridge } = NativeModules;
  const { requestId, setRequestId } = useContext(RequestContext);
  // const { requestid } = useLocalSearchParams<{
  //   requestid: string;
  // }>();
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [fare, setFare] = useState<number | any>(0);
  const [returnFare, setReturnFare] = useState<number | any>(0);
  const [zpTransId, setZpTransId] = useState<string | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [destinationSelected, setDestinationSelected] = useState(false);
  const [originCoordinates, setOriginCoordinates] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [destinationCoordinates, setDestinationCoordinates] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);
  // State cho cancellation actionsheet và alert confirmation
  const [showCancelActionsheet, setShowCancelActionsheet] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const cancelReasons = [
    "Repair cost too high",
    "Mechanic behavior not acceptable",
    "Change of plans",
    "Other",
  ];

  // Hàm xử lý khi fetch địa chỉ từ geocode
  const handleFetchLocation = async (address: string) => {
    const result = await geocodeAddress(address);
    if (result) {
      const { lat, lng } = result;
      setDestinationCoordinates({ latitude: lat, longitude: lng });
      setDestinationResults([]);
      setDestinationSelected(true);
    }
  };

  const handleDestinationChange = (text: string) => {
    setDestinationQuery(text);
    setDestinationSelected(false);
  };
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (destinationQuery.trim()) {
        getAutocomplete(
          destinationQuery,
          originCoordinates.latitude && originCoordinates.longitude
            ? `${originCoordinates.latitude},${originCoordinates.longitude}`
            : ""
        ).then(setDestinationResults);
      } else {
        setDestinationResults([]);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [destinationQuery, originCoordinates]);
  const { token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  const [requestDetail, setRequestDetail] =
    useState<RepairRequestDetail | null>(null);
  const [repairQuotes, setRepairQuotes] = useState<RepairQuote[]>([]);
  const fetchRequestDetail = async () => {
    try {
      const response = await axios.get<RepairRequestDetail>(
        `https://motor-save-be.vercel.app/api/v1/requests/repair/detail/${requestId}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      setRequestDetail(response.data);
    } catch (error) {
      console.error("Error fetching request details:", error);
    }
  };
  const fetchRepairQuote = async () => {
    try {
      const response = await axios.get<RepairQuote[]>(
        `https://motor-save-be.vercel.app/api/v1/repairquotes/requestdetail/${requestDetail?.requestdetailid}`
      );
      setRepairQuotes(response.data);
      setFare(requestDetail?.totalprice);
    } catch (error) {
      console.error("Error fetching repair quotes:", error);
    }
  };
  useEffect(() => {
    fetchRequestDetail();
    const interval = setInterval(fetchRequestDetail, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      requestDetail?.requeststatus !== "Pending" &&
      requestDetail?.requeststatus !== "Inspecting"
    ) {
      fetchRepairQuote();
    }
  }, [requestDetail?.requeststatus]);

  useEffect(() => {
    if (
      requestDetail?.requeststatus === "Done" &&
      destinationSelected === true
    ) {
      const timer = setTimeout(() => {
        router.navigate(
          "/user/customer/home/emergencyRescue/returnVehicleRequest"
        );
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [requestDetail?.requeststatus]);

  const getStatusColor = () => {
    switch (requestDetail?.requeststatus) {
      case "Pending":
        return "bg-orange-500";
      case "Inspecting":
        return "bg-blue-500";
      case "Waiting":
        return "bg-yellow-500";
      case "Accepted":
        return "bg-green-500";
      case "Repairing":
        return "bg-gray-500";
      case "Done":
        return "bg-gray-500";
      default:
        return "bg-gray-200";
    }
  };
  useEffect(() => {
    if (destinationSelected) {
      const originStr = `${requestDetail?.lat},${requestDetail?.long}`;
      const destinationStr = `${destinationCoordinates.latitude},${destinationCoordinates.longitude}`;
      getDirections(originStr, destinationStr)
        .then((data) => {
          if (data.routes && data.routes.length > 0) {
            if (data.routes[0].legs && data.routes[0].legs.length > 0) {
              setDirectionsInfo(data.routes[0].legs[0]);
            }
          } else {
            console.log("No routes found:", data);
          }
        })
        .catch((error) => console.error("Error fetching directions:", error));
    }
  }, [destinationCoordinates, destinationSelected]);

  useEffect(() => {
    if (directionsInfo) {
      const distanceValue = directionsInfo.distance?.value || 0;
      calculateFare(distanceValue, 1, 0)
        .then((money) => {
          setReturnFare(money);
          console.log("Set fare success");
        })
        .catch((error) => {
          console.error("Error calculating fare:", error);
        });
    }
  }, [directionsInfo]);

  const handleCashPayment = async () => {
    if (!token) return;
    setPaymentLoading(true);
    const payment = await createPayment(
      {
        requestdetailid: requestDetail?.requestdetailid,
        totalamount: fare,
        paymentmethod: "Tiền mặt",
        paymentstatus: "Unpaid",
      },
      token
    );
    console.log(payment);
    const payload: RescueRequestPayload = {
      pickuplong: requestDetail?.long,
      pickuplat: requestDetail?.lat,
      deslng: destinationCoordinates.longitude,
      deslat: destinationCoordinates.latitude,
      pickuplocation: requestDetail?.stationaddress,
      destination: destinationQuery,
      totalprice: returnFare || 0,
    };
    try {
      if (destinationQuery !== "") {
        const result = await createReturnVehicleRequest(
          payload,
          token,
          requestDetail?.requestid
        );
        console.log(result);
        const reqid = result.requestdetailid;
        const returnPayment = await createPayment(
          {
            requestdetailid: reqid,
            totalamount: returnFare,
            paymentmethod: "Tiền mặt",
            paymentstatus: "Unpaid",
          },
          token
        );
        console.log("Return vehicle payment: " + returnPayment);
      }
      await acceptRepairQuote(requestDetail?.requestdetailid, token);
    } catch (error) {
      console.error("Error during payment:", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleZaloPayment = async () => {
    const callbackUrl =
      "myapp://user/customer/home/emergencyRescue/repairRequest";
    if (!token) return;
    setPaymentLoading(true);
    const payload: RescueRequestPayload = {
      pickuplong: requestDetail?.long,
      pickuplat: requestDetail?.lat,
      deslng: destinationCoordinates.longitude,
      deslat: destinationCoordinates.latitude,
      pickuplocation: requestDetail?.stationaddress,
      destination: destinationQuery,
      totalprice: returnFare || 0,
    };
    try {
      if (destinationQuery !== "") {
        const result = await createReturnVehicleRequest(
          payload,
          token,
          requestDetail?.requestid
        );
        console.log(result);
        const reqid = result.requestdetailid;
        const returnPayment = await createPayment(
          {
            requestdetailid: reqid,
            totalamount: returnFare,
            paymentmethod: "Tiền mặt",
            paymentstatus: "Unpaid",
          },
          token
        );
        console.log("Return vehicle payment: " + returnPayment);
      }
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
                  requestdetailid: requestDetail?.requestdetailid,
                  zptransid: data.transactionId || "",
                  totalamount: fare,
                  paymentmethod: "ZaloPay",
                  paymentstatus: "Success",
                },
                token
              );
              console.log("Transaction created:", transactionResponse);
              await acceptRepairQuote(requestDetail?.requestdetailid, token);
            } catch (error) {
              console.error("Error creating transaction:", error);
            }
          } else {
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

  const handleCall = () => {
    handlePhoneCall(requestDetail?.mechanicphone);
  };

  const toChatScreen = () => {
    router.push({
      pathname: "/user/customer/home/chatScreen",
      params: {
        currentUserId: userId,
        staffId: requestDetail?.mechanicid,
        requestDetailId: requestDetail?.requestdetailid,
      },
    });
  };

  // Hàm xử lý hủy chuyến sử dụng API cancelRequest từ beAPI
  const handleSubmitCancellation = async () => {
    let reasonToSend = selectedReason;
    if (selectedReason === "Other") {
      if (!customReason.trim()) {
        Alert.alert("Please enter a cancellation reason");
        return;
      }
      reasonToSend = customReason.trim();
    }
    console.log("Cancelling request with reason:", reasonToSend);
    try {
      const response = await cancelRequest(
        requestDetail?.requestdetailid,
        token,
        reasonToSend
      );
      console.log("Cancel response:", response);
      Alert.alert("Request has been cancelled", response.message);
      router.navigate("/user/customer/home/homepage");
      setShowCancelActionsheet(false);
      setShowCancelAlert(false);
    } catch (error: any) {
      console.error("Error cancelling request:", error);
      Alert.alert(
        "Failed to cancel request",
        error?.response?.data?.message || error.message
      );
    } finally {
      setShowCancelAlert(false);
      setShowCancelActionsheet(false);
    }
  };

  const renderProgressSteps = () => {
    const steps = [
      { title: "Pending", status: "Pending" },
      { title: "Inspecting", status: "Inspecting" },
      { title: "Waiting", status: "Waiting" },
      { title: "Accepted", status: "Accepted" },
      { title: "Repairing", status: "Repairing" },
      { title: "Done", status: "Done" },
    ];

    const currentStepIndex = steps.findIndex(
      (step) => step.status === requestDetail?.requeststatus
    );

    return (
      <Box className="mt-6">
        <Box className="flex-row justify-between items-center relative">
          <Box className="absolute top-4 left-[10%] right-[10%] h-[1px]">
            <Box className="w-full h-0.5 bg-gray-200">
              <Box
                className={`h-full ${getStatusColor()}`}
                style={{
                  width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                }}
              />
            </Box>
          </Box>
          {steps.map((step, index) => (
            <Box key={step.status} className="items-center flex-1">
              <Box className="h-8 flex items-center justify-center relative z-10">
                <Box
                  className={`w-8 h-8 rounded-full ${index <= currentStepIndex ? getStatusColor() : "bg-gray-200"
                    } items-center justify-center`}
                >
                  <CheckCircle2 size={16} color="white" />
                </Box>
              </Box>
              <Box className="h-12 justify-start pt-2">
                <Text
                  className={`text-xs text-center px-1 ${index <= currentStepIndex
                    ? "text-gray-900"
                    : "text-gray-500"
                    }`}
                  numberOfLines={2}
                >
                  {step.title}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <Box className="flex-1 px-4 py-3">
        <Box className="flex-row items-center mb-2">
          <Pressable
            onPress={() => router.navigate("/user/customer/home/homepage")}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text bold size="xl" className="flex-1 text-center mr-10">
            Yêu cầu sửa xe
          </Text>
        </Box>
        <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4 text-center">
            Thông tin thợ sửa xe
          </Text>
          <Box className="flex-row items-center">
            <Avatar
              size={52}
              rounded
              source={{ uri: requestDetail?.mechanicavatar || "https://example.com/default-avatar.png" }}
              containerStyle={{ borderWidth: 2, borderColor: 'white' }}
            />
            <Box className="ml-3">
              <Text className="text-sm text-gray-500">Họ và tên</Text>
              <Text className="text-base text-gray-900">
                {requestDetail?.requeststatus !== "Pending"
                  ? requestDetail?.mechanicname
                  : "Not Yet"}
              </Text>
            </Box>
          </Box>

          <Box className="flex-row items-center">
            <Phone size={20} color="#6B7280" />
            <Box className="ml-3">
              <Text className="text-sm text-gray-500">Số điện thoại</Text>
              <Text className="text-base text-gray-900">
                {requestDetail?.requeststatus !== "Pending"
                  ? requestDetail?.mechanicphone
                  : "Not Yet"}
              </Text>
            </Box>
          </Box>
          <Box className="flex-row items-center">
            <Car size={20} color="#6B7280" />
            <Box className="ml-3">
              <Text className="text-sm text-gray-500">Trạm</Text>
              <Text className="text-base text-gray-900">
                {requestDetail?.stationname}
              </Text>
            </Box>
          </Box>
          <Box className="flex-row items-center">
            <AlertCircle size={20} color="#6B7280" />
            <Box className="ml-3">
              <Text className="text-sm text-gray-500">Địa chỉ</Text>
              <Text className="text-base text-gray-900">
                {requestDetail?.stationaddress}
              </Text>
            </Box>
          </Box>
          <Box className="flex-row justify-center mt-6">
            <Text
              className="text-blue-600 font-semibold"
              onPress={() =>
                router.navigate(
                  "/user/customer/home/emergencyRescue/repairCostPreview"
                )
              }
            >
              Xem bảng giá dịch vụ sửa chữa
            </Text>
          </Box>
        </Box>
        <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          {renderProgressSteps()}
        </Box>
        {/* Repair Quote List */}
        {requestDetail?.requeststatus !== "Pending" &&
          requestDetail?.requeststatus !== "Inspecting" && (
            <Box className="flex-1 bg-white rounded-2xl shadow-sm p-4 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4 text-center">
                Phí sửa chữa
              </Text>

              <Text className="text-lg font-bold text-gray-900 mt-3 mb-1">
                Gói sửa chữa
              </Text>

              {repairQuotes.filter(
                (quote) => quote.repairpackagename === "Basic"
              ).length > 0 ? (
                repairQuotes
                  .filter((quote) => quote.repairpackagename === "Basic")
                  .map((item) => (
                    <Box
                      key={item.id}
                      className="flex-row justify-between item-center"
                    >
                      <Box className="flex-1">
                        <Text className="text-base font-semibold text-[#1a3148]">
                          {item.repairname}
                        </Text>
                      </Box>
                      <Text className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                        {formatMoney(
                          item.repairpackagename === "Basic"
                            ? item.wage || 0
                            : item.cost
                        )}
                      </Text>
                    </Box>
                  ))
              ) : (
                <Text className="text-gray-500 italic">
                  Không có gói sửa chữa
                </Text>
              )}

              <Divider className="mt-2"></Divider>

              <Text className="text-lg font-bold text-gray-900 mt-4 mb-1">
                Danh sách linh kiện thay thế
              </Text>

              {repairQuotes.filter(
                (quote) => quote.repairpackagename === "Addons"
              ).length > 0 ? (
                repairQuotes
                  .filter((quote) => quote.repairpackagename === "Addons")
                  .map((item) => (
                    <Box
                      key={item.id}
                      className="flex-row justify-between item-center"
                    >
                      <Box className="flex-1">
                        <Text className="text-base font-semibold text-[#1a3148]">
                          {item.accessoryname || item.repairname}
                        </Text>
                        <Text className="text-base font-semibold text-gray-500">
                          {item.partcategoryname}
                        </Text>
                        <Text className="text-xs">
                          Phụ thu: {formatMoney(item.wage)}
                        </Text>
                      </Box>
                      <Box>
                        <Text className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                          {formatMoney(item.cost)}
                        </Text>
                      </Box>
                    </Box>
                  ))
              ) : (
                <Text className="text-gray-500 italic">Không có linh kiện</Text>
              )}

              <Divider className="mt-2"></Divider>

              <Box className="flex-row justify-between items-center mt-4 pt-3 border-gray-300">
                <Text className="text-base font-semibold text-gray-900 mb-2">
                  Tổng phụ thu
                </Text>
                <Text className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {formatMoney(
                    repairQuotes
                      .filter((quote) => quote.repairpackagename !== "Basic")
                      .reduce((sum, item) => sum + (item.wage || 0), 0)
                  )}
                </Text>
              </Box>

              <Divider className="mt-2"></Divider>

              {/* Total Price */}
              <Box className="flex-row justify-between items-center my-4 pt-3">
                <Text className="text-lg font-bold text-gray-900">
                  Tổng đơn
                </Text>
                <Text className="bg-pink-100 text-black-800 text-base font-bold px-3 py-1 rounded-full">
                  {formatMoney(requestDetail?.totalprice || 0)}
                </Text>
              </Box>

              <Divider></Divider>

              {/* Return vehicle location */}
              <Box className="mt-2">
                <Text className="text-base font-semibold text-gray-900 mb-2">
                  Địa điểm trả xe (Không bắt buộc)
                </Text>
                <Input variant="outline" size="md" className="bg-white">
                  <InputField
                    placeholder="Tìm địa điểm"
                    value={destinationQuery}
                    onChangeText={handleDestinationChange}
                  />
                </Input>
              </Box>
              {destinationResults.length > 0 && !destinationSelected && (
                <Box className="bg-white-rounded max-h-40">
                  {destinationResults.map((item, index) => (
                    <Pressable
                      key={index.toString()}
                      onPress={() => {
                        setDestinationQuery(item.description);
                        handleFetchLocation(item.description);
                      }}
                      className="p-2"
                    >
                      <Text className="text-black">{item.description}</Text>
                    </Pressable>
                  ))}
                </Box>
                // <FlatList
                //   data={destinationResults}
                //   keyExtractor={(_item, index) => index.toString()}
                //   className="bg-white rounded max-h-40"
                //   renderItem={({ item }) => (
                //     <Pressable
                //       onPress={() => {
                //         setDestinationQuery(item.description);
                //         handleFetchLocation(item.description);
                //       }}
                //       className="p-2"
                //     >
                //       <Text className="text-black">{item.description}</Text>
                //     </Pressable>
                //   )}
                // />
              )}
              {/* Payment method */}
              <Box className="mt-4">
                <Text className="text-base font-semibold text-gray-900 mb-2">
                  Phương thức thanh toán
                </Text>
                <Select
                  selectedValue={paymentMethod}
                  onValueChange={(value: any) => setPaymentMethod(value)}
                >
                  <SelectTrigger className="border border-gray-200 rounded-xl p-5 flex-row items-center justify-between bg-gray-50 h-13">
                    <SelectInput
                      placeholder="Select payment method"
                      className="text-lg flex-1"
                    />
                    <SelectIcon as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectItem label="Tiền mặt" value="Tiền mặt" />
                      <SelectItem label="Zalopay" value="Zalopay" />
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </Box>

              {/* Action Buttons */}
              {requestDetail?.requeststatus === "Waiting" && (
                <Box className="flex-row justify-between mt-6">
                  <Button
                    variant="outline"
                    className="flex-1 mx-2 border-red-500"
                    onPress={() => setShowCancelActionsheet(true)}
                  >
                    <ButtonText className="text-red-500">Cancel</ButtonText>
                  </Button>

                  <Button
                    variant="solid"
                    className="flex-1 mx-2 bg-blue-500"
                    onPress={
                      paymentMethod === "Tiền mặt"
                        ? handleCashPayment
                        : handleZaloPayment
                    }
                  >
                    <ButtonText className="text-white">
                      {paymentLoading ? "Processing..." : "Confirm"}
                    </ButtonText>
                  </Button>
                </Box>
              )}
            </Box>
          )}
        {/* Phone and chat button */}
        {requestDetail?.requeststatus !== "Pending" && (
          <>
            <Box className="absolute right-5 top-20 flex-col space-y-2 gap-2">
              <Pressable
                onPress={handleCall}
                className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-sm"
              >
                <Phone size={18} color="white" />
              </Pressable>
              <Pressable
                onPress={toChatScreen}
                className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-sm"
              >
                <MessageSquare size={18} color="white" />
              </Pressable>
            </Box>
          </>
        )}
        {/* Cancellation Actionsheet */}
        <Actionsheet
          isOpen={showCancelActionsheet}
          onClose={() => setShowCancelActionsheet(false)}
          snapPoints={[50]}
          closeOnOverlayClick={true}
          isKeyboardDismissable={true}
        >
          <ActionsheetBackdrop
            onPress={() => setShowCancelActionsheet(false)}
          />
          <ActionsheetContent className="bg-white rounded-t-3xl p-4">
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <Text className="text-lg font-bold text-center mb-4">
              Cancel Request
            </Text>
            <VStack space="md">
              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>
                    Select a reason for cancellation
                  </FormControlLabelText>
                </FormControlLabel>
                <RadioGroup
                  value={selectedReason}
                  onChange={(nextValue: React.SetStateAction<string>) =>
                    setSelectedReason(nextValue)
                  }
                >
                  {cancelReasons.map((reason) => (
                    <Radio key={reason} value={reason}>
                      <RadioLabel>{reason}</RadioLabel>
                    </Radio>
                  ))}
                </RadioGroup>
              </FormControl>
              {selectedReason === "Other" && (
                <FormControl isRequired isInvalid={!customReason.trim()}>
                  <FormControlLabel>
                    <FormControlLabelText>
                      Enter custom reason
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input variant="outline" size="md">
                    <InputField
                      placeholder="Enter reason..."
                      value={customReason}
                      onChangeText={setCustomReason}
                    />
                  </Input>
                  {!customReason.trim() && (
                    <FormControlError>
                      <FormControlErrorIcon />
                      <FormControlErrorText>
                        Reason is required.
                      </FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              )}
              <Button
                onPress={() => setShowCancelAlert(true)}
                className="bg-red-500"
                size="md"
              >
                <ButtonText>Submit Cancellation</ButtonText>
              </Button>
            </VStack>
          </ActionsheetContent>
        </Actionsheet>

        {/* AlertDialog xác nhận hủy request */}
        <AlertDialog
          isOpen={showCancelAlert}
          onClose={() => setShowCancelAlert(false)}
          size="md"
        >
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <Text className="text-lg font-bold">Confirm Cancellation</Text>
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text>Are you sure you want to cancel the request?</Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                variant="outline"
                action="secondary"
                size="sm"
                onPress={() => setShowCancelAlert(false)}
              >
                <ButtonText>Back</ButtonText>
              </Button>
              <Button size="sm" onPress={handleSubmitCancellation}>
                <ButtonText>Confirm</ButtonText>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Box>
    </ScrollView>
  );
};

export default RepairRequestScreen;
