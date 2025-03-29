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
import { decodedToken, handlePhoneCall } from "@/app/utils/utils";
import { PayZaloEventData, processPayment } from "@/app/utils/payment";
import {
  acceptRepairQuote,
  calculateFare,
  createPayment,
  createReturnVehicleRequest,
  createTransaction,
  RescueRequestPayload,
} from "@/app/services/beAPI";
import { RequestContext } from "@/app/context/RequestContext";

const RepairRequestScreen = () => {
  const { PayZaloBridge } = NativeModules;
  const { requestId, setRequestId } = useContext(RequestContext);
  // const { requestid } = useLocalSearchParams<{
  //   requestid: string;
  // }>();
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [fare, setFare] = useState<number | any>(0);
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
    if (requestDetail?.requeststatus === "Done") {
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
      calculateFare(distanceValue)
        .then((money) => {
          setFare(money);
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
      totalprice: fare || 0,
    };
    try {
      if (destinationQuery !== "") {
        const result = await createReturnVehicleRequest(
          payload,
          token,
          requestDetail?.requestid
        );
        console.log(result);
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
      totalprice: fare || 0,
    };
    try {
      if (destinationQuery !== "") {
        const result = await createReturnVehicleRequest(
          payload,
          token,
          requestDetail?.requestid
        );
        console.log(result);
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
                  className={`w-8 h-8 rounded-full ${
                    index <= currentStepIndex ? getStatusColor() : "bg-gray-200"
                  } items-center justify-center`}
                >
                  <CheckCircle2 size={16} color="white" />
                </Box>
              </Box>
              <Box className="h-12 justify-start pt-2">
                <Text
                  className={`text-xs text-center px-1 ${
                    index <= currentStepIndex
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
            Repair Vehicle Request
          </Text>
        </Box>
        <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4 text-center">
            Mechanic Information
          </Text>
          <Box className="flex-row items-center">
            <User size={20} color="#6B7280" />
            <Box className="ml-3">
              <Text className="text-sm text-gray-500">Mechanic Name</Text>
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
              <Text className="text-sm text-gray-500">Phone Number</Text>
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
              <Text className="text-sm text-gray-500">Station</Text>
              <Text className="text-base text-gray-900">
                {requestDetail?.stationname}
              </Text>
            </Box>
          </Box>
          <Box className="flex-row items-center">
            <AlertCircle size={20} color="#6B7280" />
            <Box className="ml-3">
              <Text className="text-sm text-gray-500">Address</Text>
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
              Xem bảng giá sửa xe
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
                Repair Quote
              </Text>

              <FlatList
                data={repairQuotes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Box className="flex-row justify-between items-center py-3 border-b border-gray-500">
                    <Box>
                      <Text className="text-base font-medium text-gray-900">
                        {item.repairname}
                      </Text>
                      {/* <Text className="text-sm text-gray-500">{item.detail}</Text> */}
                    </Box>
                    <Text className="text-base font-semibold text-gray-900">
                      {item.cost.toLocaleString()} VND
                    </Text>
                  </Box>
                )}
              />

              {/* Total Price */}
              <Box className="flex-row justify-between items-center my-4 pt-3">
                <Text className="text-base font-semibold text-gray-900">
                  Total Price
                </Text>
                <Text className="text-lg font-bold text-red-500">
                  {requestDetail?.totalprice} VND
                </Text>
              </Box>

              {/* Return vehicle location */}
              <Box className="mt-2">
                <Text className="text-base font-semibold text-gray-900 mb-2">
                  Return vehicle location (Optional)
                </Text>
                <Input variant="outline" size="md" className="bg-white">
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
                  keyExtractor={(_item, index) => index.toString()}
                  className="bg-white rounded max-h-40"
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setDestinationQuery(item.description);
                        handleFetchLocation(item.description);
                      }}
                      className="p-2"
                    >
                      <Text className="text-black">{item.description}</Text>
                    </Pressable>
                  )}
                />
              )}
              {/* Payment method */}
              <Box className="mt-4">
                <Text className="text-base font-semibold text-gray-900 mb-2">
                  Payment Method
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
                    onPress={() => console.log("Cancel Pressed")}
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
            <Pressable
              onPress={handleCall}
              className="absolute top-20 right-5 w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-sm"
            >
              <Phone size={18} color="white" />
            </Pressable>
            <Pressable
              onPress={toChatScreen}
              className="absolute top-40 right-5 w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-sm"
            >
              <MessageSquare size={18} color="white" />
            </Pressable>
          </>
        )}
      </Box>
    </ScrollView>
  );
};

export default RepairRequestScreen;
