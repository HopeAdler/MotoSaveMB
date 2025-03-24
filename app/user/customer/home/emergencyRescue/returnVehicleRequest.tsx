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
  CreditCard,
  MapPin,
  MessageSquare,
  Phone,
  User,
} from "lucide-react-native";
import axios from "axios";
import AuthContext from "@/app/context/AuthContext";
import {
  RepairQuote,
  RepairRequestDetail,
  RequestDetail,
} from "@/app/context/formFields";
import {
  ActivityIndicator,
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
  createReturnVehicleRequest,
  createTransaction,
  RescueRequestPayload,
} from "@/app/services/beAPI";
import { RequestContext } from "@/app/context/RequestContext";
import { Avatar } from "react-native-elements";

const ReturnVehicleRequestScreen = () => {
  const { PayZaloBridge } = NativeModules;
  const { requestId } = useContext(RequestContext);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [fare, setFare] = useState<number | any>(0);
  const [zpTransId, setZpTransId] = useState<string | null>(null);
  const { token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  const [requestdetailid, setRequestdetailid] = useState<string | null>(null);
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(
    null
  );
  const fetchRequestDetail = async () => {
    try {
      const response = await axios.get<RequestDetail>(
        `https://motor-save-be.vercel.app/api/v1/requests/returnVehicle/${requestId}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      setRequestDetail(response.data);
      setFare(response.data?.totalprice);
      setRequestdetailid(response.data?.requestdetailid);
    } catch (error) {
      console.error("Error fetching request details:", error);
    }
  };
  useEffect(() => {
    fetchRequestDetail();
    console.log("Fare: " + fare);
    console.log("Request detail id: " + requestdetailid);
    const interval = setInterval(fetchRequestDetail, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (requestDetail?.requeststatus === "Done") {
      const timer = setTimeout(() => {
        router.push({
          pathname: "/user/customer/home/feedback",
          params: { requestdetailid },
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [requestDetail?.requeststatus]);

  const getStatusColor = () => {
    switch (requestDetail?.requeststatus) {
      case "Pending":
        return "bg-orange-500";
      case "Accepted":
        return "bg-blue-500";
      case "Processing":
        return "bg-green-500";
      case "Done":
        return "bg-gray-500";
      default:
        return "bg-gray-200";
    }
  };

  const handleZaloPayment = async () => {
    const callbackUrl =
      "myapp://user/customer/home/emergencyRescue/returnVehicleRequest";
    setPaymentLoading(true);
    try {
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
    handlePhoneCall(requestDetail?.driverphone);
  };

  const toChatScreen = () => {
    router.push({
      pathname: "/user/customer/home/chatScreen",
      params: {
        currentUserId: userId,
        staffId: requestDetail?.driverid,
        requestDetailId: requestDetail?.requestdetailid,
      },
    });
  };

  const renderProgressSteps = () => {
    const steps = [
      { title: "Pending", status: "Pending" },
      { title: "Driver Accepted", status: "Accepted" },
      { title: "Return Vehicle Processing", status: "Processing" },
      { title: "Completed", status: "Done" },
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
            Return Vehicle Request
          </Text>
        </Box>
        <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <Box className="flex-row items-center w-full mb-6">
            <Avatar
              size={80}
              rounded
              source={{
                uri: "https://pbs.twimg.com/media/GEXDdESbIAAd5Qt?format=jpg&name=large",
              }}
              containerStyle={{ borderWidth: 2, borderColor: "#f2f2f2" }}
            />
            <Box className="ml-4">
              <Text className="text-xl font-bold">
                {requestDetail?.drivername || "Awaiting Driver"}
              </Text>
              <Text className="text-gray-600 mt-1">
                License plate: {requestDetail?.brandname}{" "}
                {requestDetail?.licenseplate}
              </Text>
              <Text className="text-gray-600 mt-1">
                Phone: {requestDetail?.driverphone}
              </Text>
            </Box>
          </Box>
          <Box className="flex-row justify-center w-full mt-1">
            <Button
              variant="outline"
              size="md"
              onPress={handleCall}
              className="mr-6"
            >
              <ButtonText>
                <Phone size={18} color="#4B5563" style={{ marginTop: 2 }} />{" "}
                Call
              </ButtonText>
            </Button>
            <Button variant="outline" size="md" onPress={toChatScreen}>
              <ButtonText>
                <MessageSquare
                  size={18}
                  color="#4B5563"
                  style={{ marginTop: 2 }}
                />{" "}
                Chat
              </ButtonText>
            </Button>
          </Box>
        </Box>
        <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          {renderProgressSteps()}
        </Box>
        <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <Box className="flex-row items-center">
            <MapPin size={20} color="#6B7280" />
            <Box className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Pickup Location</Text>
              <Text className="text-base text-gray-900">
                {requestDetail?.pickuplocation}
              </Text>
            </Box>
          </Box>

          <Box className="flex-row items-center">
            <AlertCircle size={20} color="#6B7280" />
            <Box className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Destination</Text>
              <Text className="text-base text-gray-900">
                {requestDetail?.destination}
              </Text>
            </Box>
          </Box>
          <Box className="mt-3">
            <Box className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl">
              <Box>
                <Text className="text-sm text-gray-500">Total Price</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {requestDetail?.totalprice.toLocaleString()} VND
                </Text>
              </Box>
              <CreditCard size={24} color="#6B7280" />
            </Box>
          </Box>
          <Box className="mt-3">
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
          {paymentMethod === "Zalopay" && (
            <Button
              variant="solid"
              size="lg"
              onPress={handleZaloPayment}
              className="bg-blue-600 h-14 rounded-xl mt-4"
            >
              <Box className="flex-row items-center">
                {paymentLoading && (
                  <ActivityIndicator size="small" color="white" />
                )}
                <ButtonText className="text-lg font-semibold ml-2">
                  {paymentLoading ? "Processing..." : "Payment Through Zalopay"}
                </ButtonText>
              </Box>
            </Button>
          )}
        </Box>
      </Box>
    </ScrollView>
  );
};

export default ReturnVehicleRequestScreen;
