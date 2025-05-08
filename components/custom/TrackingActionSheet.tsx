import React, { useContext, useEffect, useState } from "react";
import { Avatar } from "react-native-elements";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetBackdrop,
} from "@/components/ui/actionsheet";
import {
  Phone,
  MessageSquare,
  AlertCircle,
  Clock,
  Navigation2,
  CheckCircle2,
  MapPin,
} from "lucide-react-native";
import AuthContext from "@/app/context/AuthContext";
import { router } from "expo-router";
import { Alert } from "react-native";

// Import các component cho form
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from "@/components/ui/radio";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { decodedToken, formatMoney, handlePhoneCall } from "@/app/utils/utils";

// Import interface RequestDetail từ formFields (với các interface khác được đặt trong file formFields)
import { RequestDetail } from "@/app/context/formFields";
// Import hàm cancelRequest từ beAPI
import { cancelRequest } from "@/app/services/beAPI";
import axios from "axios";
import { RequestContext } from "@/app/context/RequestContext";
import { useLatReqDetStore } from "@/app/hooks/useLatReqDetStore";
import { CircleIcon } from "../ui/icon";
import { usePubNubService } from "@/app/services/pubnubService";
const cancelReasons = [
  "Driver delayed",
  "Driver behavior not acceptable",
  "Change of plans",
  "Other",
];

interface TrackingActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  requestDetailIdState: [string, React.Dispatch<React.SetStateAction<string | null>>];
  eta: string;
  distance: string;
  driverId: string | null;
  setAcceptedReqDetStatus: React.Dispatch<React.SetStateAction<string>>;
}

const TrackingActionSheet: React.FC<TrackingActionSheetProps> = ({
  isOpen,
  onClose,
  requestDetailIdState: [requestdetailid, setRequestDetailId],
  eta,
  distance,
  driverId,
  setAcceptedReqDetStatus,
}) => {
  const { token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(
    null
  );
  const { setRequestId } = useContext(RequestContext);
  const [loading, setLoading] = useState<boolean>(true);

  const {
    latestRequestDetail,
  } = useLatReqDetStore();
  const {
    publishCancelRescueForCust,
  } = usePubNubService();

  // State cho cancellation actionsheet và alert confirmation
  const [showCancelActionsheet, setShowCancelActionsheet] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const fetchRequestDetail = async () => {
    try {
      const latReqDetId = requestdetailid ? requestdetailid : latestRequestDetail?.requestdetailid
      const response = await axios.get<RequestDetail>(
        `https://motor-save-be.vercel.app/api/v1/requests/driver/${latReqDetId}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      setRequestDetail(response.data);
      setRequestId(response.data?.requestid)
      setAcceptedReqDetStatus(response.data?.requeststatus);
      console.log("Fetching request detail...");
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRequestDetail();
    const interval = setInterval(fetchRequestDetail, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (requestDetail?.requeststatus === "Done") {
      console.log(requestDetail);
      setRequestId(null);
      const timer = setTimeout(() => {
        if (requestDetail?.servicepackagename === "Cứu hộ đến trạm") {
          router.navigate("/user/customer/home/emergencyRescue/repairRequest");
        } else {
          router.push({
            pathname: "/user/customer/home/feedback",
            params: { requestdetailid },
          });
        }
        setRequestDetailId(null);
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [requestDetail?.requeststatus]);

  console.log("Request Detail:", requestDetail?.requestdetailid);
  console.log("Request Status:", requestDetail?.requeststatus);
  console.log("Request ID:", requestDetail?.requestid);
  console.log("request detail:", requestdetailid);

  const getStatusColor = () => {
    switch (requestDetail?.requeststatus) {
      case "Pending":
        return "#fab753";
      case "Accepted":
        return "#fab753";
      case "Pickup":
        return "#fab753";
      case "Processing":
        return "#fab753";
      case "Done":
        return "#fab753";
      default:
        return "#fab753";
    }
  };

  const renderProgressSteps = () => {
    const steps = [
      { title: "Tài xế đã nhận", status: "Accepted" },
      { title: "Tài xế đang đến", status: "Pickup" },
      { title: "Đang xử lý", status: "Processing" },
      { title: "Hoàn thành", status: "Done" },
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
                className={`h-full`}
                style={{
                  width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                  backgroundColor: getStatusColor(),
                }}
              />
            </Box>
          </Box>
          {steps.map((step, index) => (
            <Box key={step.status} className="items-center flex-1">
              <Box className="h-8 flex items-center justify-center relative z-10">
                <Box
                  className={`w-8 h-8 rounded-full items-center justify-center`}
                  style={{
                    backgroundColor: index <= currentStepIndex ? getStatusColor() : "#E5E7EB"
                  }}
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

  const handleCall = () => {
    handlePhoneCall(requestDetail?.driverphone);
  };

  const toChatScreen = () => {
    onClose();
    router.push({
      pathname: "/user/customer/home/chatScreen",
      params: {
        currentUserId: userId,
        staffId: driverId,
        requestDetailId: requestdetailid,
      },
    });
  };
  // Hàm xử lý hủy chuyến sử dụng API cancelRequest từ beAPI
  const handleSubmitCancellation = async () => {
    if (!requestdetailid) {
      Alert.alert("Request ID không tồn tại");
      return;
    }
    let reasonToSend = selectedReason;
    if (selectedReason === "Other") {
      if (!customReason.trim()) {
        Alert.alert("Please enter a cancellation reason");
        return;
      }
      reasonToSend = customReason.trim();
    }
    console.log("Cancelling ride with reason:", reasonToSend);
    try {
      const response = await cancelRequest(
        requestdetailid,
        token,
        reasonToSend
      );
      if (response) await publishCancelRescueForCust(requestdetailid,reasonToSend);
      console.log("Cancel response:", response);
      Alert.alert("Ride has been cancelled", response.message);
      onClose();
      router.navigate("/user/customer/home/homepage");
      setShowCancelActionsheet(false);
      setShowCancelAlert(false);
    } catch (error: any) {
      console.error("Error cancelling ride:", error);
      Alert.alert(
        "Failed to cancel ride",
        error?.response?.data?.message || error.message
      );
    } finally {
      setShowCancelAlert(false);
      setShowCancelActionsheet(false);
    }
  };

  return (
    <>
      {/* Tracking Actionsheet */}
      <Actionsheet
        isOpen={isOpen}
        onClose={onClose}
        snapPoints={[80]}
        closeOnOverlayClick={true}
        isKeyboardDismissable={true}
      >
        <ActionsheetBackdrop onPress={onClose} />
        <ActionsheetContent className="bg-white rounded-t-3xl px-0 pt-2 pb-6">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator className="bg-gray-300 rounded-full w-10 h-1 mx-auto my-2" />
          </ActionsheetDragIndicatorWrapper>

          {/* <Box className="px-6 py-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-center text-[#1a3148]">
              {requestDetail?.requeststatus === "Pending"
                ? "Finding a driver..."
                : requestDetail?.requeststatus === "Accepted"
                  ? "Driver accepted your request"
                  : requestDetail?.requeststatus === "Pickup"
                    ? "Driver is on the way"
                    : requestDetail?.requeststatus === "Processing"
                      ? "On rescue mission"
                      : "Completed"}
            </Text>
          </Box> */}

          <Box className="p-6 space-y-4">
            <Box className="flex-row items-center w-full mb-2">
              <Avatar
                size={80}
                rounded
                source={{ uri: requestDetail?.driverimage || "https://example.com/default-avatar.png" }}
                containerStyle={{ borderWidth: 2, borderColor: "#f2f2f2" }}
              />
              <Box className="ml-4 flex-1">
                <Text className="text-xl font-bold text-[#1a3148]">
                  {requestDetail?.drivername || "Awaiting Driver"}
                </Text>
                <Text className="text-gray-600 mt-1">
                  {requestDetail?.brandname} {requestDetail?.licenseplate}
                </Text>
              </Box>

              <Box className="flex-row gap-2">
                <Button
                  variant="solid"
                  onPress={handleCall}
                  className={`rounded-xl h-12 w-12 items-center justify-center ${requestDetail?.requeststatus === "Done" ? "bg-gray-200" : "bg-[#1a3148]"
                    }`}
                  disabled={requestDetail?.requeststatus === "Done"}
                >
                  <Phone
                    size={22}
                    color={requestDetail?.requeststatus === "Done" ? "#9CA3AF" : "white"}
                  />
                </Button>
                <Button
                  variant="solid"
                  onPress={toChatScreen}
                  className={`rounded-xl h-12 w-12 items-center justify-center ${requestDetail?.requeststatus === "Done" ? "bg-gray-200" : "bg-[#fab753]"
                    }`}
                  disabled={requestDetail?.requeststatus === "Done"}
                >
                  <MessageSquare
                    size={22}
                    color={requestDetail?.requeststatus === "Done" ? "#9CA3AF" : "white"}
                  />
                </Button>
              </Box>
            </Box>

            <Box className="bg-[#f8fafc] rounded-xl p-4">
              <Box className="flex-row justify-between">
                <Box className="flex-1 items-center">
                  <Box className="flex-row items-center">
                    <Box className="w-12 h-12 bg-[#1a3148]/5 rounded-xl items-center justify-center">
                      <Navigation2 size={24} color="#1a3148" />
                    </Box>
                    <Box className="ml-3">
                      <Text className="text-sm text-gray-500">
                        Khoảng cách
                      </Text>
                      <Text className="text-xl font-bold text-[#1a3148]">
                        {distance}
                      </Text>
                    </Box>
                  </Box>
                </Box>

                <Box className="w-[1px] h-16 bg-gray-200 mx-2 self-center" />

                <Box className="flex-1 items-center">
                  <Box className="flex-row items-center">
                    <Box className="w-12 h-12 bg-[#1a3148]/5 rounded-xl items-center justify-center">
                      <Clock size={24} color="#1a3148" />
                    </Box>
                    <Box className="ml-3">
                      <Text className="text-sm text-gray-500">
                        Thời gian
                      </Text>
                      <Text className="text-xl font-bold text-[#1a3148]">
                        {eta}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box className="bg-[#f8fafc] rounded-xl p-4 space-y-3 w-full relative">
              <Box className="absolute left-[31px] top-[60px] w-[1.5px] h-[28px] bg-black/10" />
              <Box className="flex-row items-center w-full">
                <Box className="w-10 h-10 bg-[#1a3148]/5 rounded-lg items-center justify-center">
                  <MapPin size={20} color="#1a3148" />
                </Box>
                <Box className="ml-3 flex-1">
                  <Text className="text-sm text-gray-500">
                    Điểm đón
                  </Text>
                  <Text className="text-base font-medium text-[#1a3148]">
                    {requestDetail?.pickuplocation}
                  </Text>
                </Box>
              </Box>

              {requestDetail?.destination && (
                <Box className="flex-row items-center w-full">
                  <Box className="w-10 h-10 bg-[#fab753]/10 rounded-lg items-center justify-center">
                    <Navigation2 size={20} color="#fab753" />
                  </Box>
                  <Box className="ml-3 flex-1">
                    <Text className="text-sm text-gray-500">
                      Điểm đến
                    </Text>
                    <Text className="text-base font-medium text-[#1a3148]">
                      {requestDetail?.destination}
                    </Text>
                  </Box>
                </Box>
              )}
            </Box>

            {renderProgressSteps()}

            {requestDetail?.totalprice &&
              <Box className="flex-row items-center justify-center w-full">
                <Text className="text-green-600 font-bold">Tổng tiền:</Text>
                <Text className="text-green-600 font-bold">{formatMoney(requestDetail?.totalprice)}</Text>
              </Box>
            }

            {(requestDetail?.requeststatus === "Accepted" ||
              requestDetail?.requeststatus === "Pickup") && (
                <Button
                  onPress={() => setShowCancelActionsheet(true)}
                  className="bg-red-50 border border-red-200 h-14 rounded-xl active:opacity-80 shadow-sm mt-5"
                  size="lg"
                >
                  <ButtonText className="text-red-600 font-bold">Huỷ chuyến</ButtonText>
                </Button>
              )}
          </Box>
        </ActionsheetContent>
      </Actionsheet>

      {/* Cancellation Actionsheet */}
      <Actionsheet
        isOpen={showCancelActionsheet}
        onClose={() => setShowCancelActionsheet(false)}
        snapPoints={[50]}
        closeOnOverlayClick={true}
        isKeyboardDismissable={true}
      >
        <ActionsheetBackdrop onPress={() => setShowCancelActionsheet(false)} />
        <ActionsheetContent className="bg-white rounded-t-3xl px-0 pt-2 pb-6">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator className="bg-gray-300 rounded-full w-10 h-1 mx-auto my-2" />
          </ActionsheetDragIndicatorWrapper>

          <Box className="px-6 py-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-center text-[#1a3148]">
              Huỷ chuyến
            </Text>
          </Box>

          <Box className="p-6">
            <VStack space="md">
              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#1a3148] font-medium">
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
                      <RadioIndicator>
                        <RadioIcon as={CircleIcon} />
                      </RadioIndicator>
                      <RadioLabel className="text-[#1a3148]">{reason}</RadioLabel>
                    </Radio>
                  ))}
                </RadioGroup>
              </FormControl>
              {selectedReason === "Other" && (
                <FormControl isRequired isInvalid={!customReason.trim()}>
                  <FormControlLabel>
                    <FormControlLabelText className="text-[#1a3148] font-medium">
                      Enter custom reason
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input variant="outline" size="md" className="border-gray-200">
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
                className="bg-[#fab753] h-14 rounded-xl active:opacity-80 shadow-sm"
                size="lg"
              >
                <ButtonText className="font-bold text-lg text-[#1a3148]">Submit Cancellation</ButtonText>
              </Button>
            </VStack>
          </Box>
        </ActionsheetContent>
      </Actionsheet>

      {/* AlertDialog xác nhận hủy chuyến */}
      <AlertDialog
        isOpen={showCancelAlert}
        onClose={() => setShowCancelAlert(false)}
        size="md"
      >
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Text className="text-lg font-bold text-[#1a3148]">Xác nhận hủy chuyến</Text>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-gray-600">Bạn có chắc là muốn hủy chuyến?</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              variant="outline"
              action="secondary"
              size="sm"
              className="border-gray-200"
              onPress={() => setShowCancelAlert(false)}
            >
              <ButtonText className="text-gray-700">Huỷ</ButtonText>
            </Button>
            <Button size="sm" className="bg-[#fab753]" onPress={handleSubmitCancellation}>
              <ButtonText className="text-[#1a3148] font-bold">Xác nhận</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TrackingActionSheet;
