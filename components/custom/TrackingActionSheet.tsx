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
import { Phone, MessageSquare, AlertCircle, Clock, Navigation2, CheckCircle2 } from "lucide-react-native";
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
import { Radio, RadioGroup, RadioLabel } from "@/components/ui/radio";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { decodedToken, handlePhoneCall } from "@/app/utils/utils";

// Import interface RequestDetail từ formFields (với các interface khác được đặt trong file formFields)
import { RequestDetail } from "@/app/context/formFields";
// Import hàm cancelRequest từ beAPI
import { cancelRequest } from "@/app/services/beAPI";
import axios from "axios";

const cancelReasons = [
  "Driver delayed",
  "Driver behavior not acceptable",
  "Change of plans",
  "Other",
];

interface TrackingActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  requestdetailid: string | null;
  eta: string;
  distance: string;
  driverId: string | null;
}

const TrackingActionSheet: React.FC<TrackingActionSheetProps> = ({
  isOpen,
  onClose,
  requestdetailid,
  eta,
  distance,
  driverId
}) => {
  const { token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // State cho cancellation actionsheet và alert confirmation
  const [showCancelActionsheet, setShowCancelActionsheet] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const fetchRequestDetail = async () => {
    try {
      const response = await axios.get<RequestDetail>(
        `https://motor-save-be.vercel.app/api/v1/requests/driver/${requestdetailid}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      setRequestDetail(response.data);
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
      const timer = setTimeout(() => {
        onClose();
        router.push({
          pathname: "/user/customer/home/feedback",
          params: { requestdetailid },
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [requestDetail?.requeststatus]);

  const getStatusColor = () => {
    switch (requestDetail?.requeststatus) {
      case "Pending":
        return "bg-orange-500";
      case "Accepted":
        return "bg-blue-500";
      case "Pickup":
        return "bg-yellow-500";
      case "Processing":
        return "bg-green-500";
      case "Done":
        return "bg-gray-500";
      default:
        return "bg-gray-200";
    }
  };

  const renderProgressSteps = () => {
    const steps = [
      { title: "Driver Accepted", status: "Accepted" },
      { title: "Driver Arriving", status: "Pickup" },
      { title: "On Rescue Mission", status: "Processing" },
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
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
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
                  className={`text-xs text-center px-1 ${index <= currentStepIndex ? "text-gray-900" : "text-gray-500"
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
    router.push({
      pathname: "/user/customer/home/normalRescue/chatScreen",
      params: {
        currentUserId: userId,
        staffId: driverId,
        requestDetailId: requestdetailid
      }
    });
  }
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
      const response = await cancelRequest(requestdetailid, token, reasonToSend);
      console.log("Cancel response:", response);
      Alert.alert("Ride has been cancelled", response.message);
      onClose();
      router.navigate("/user/customer/home/homepage");
      setShowCancelActionsheet(false);
      setShowCancelAlert(false);
    } catch (error: any) {
      console.error("Error cancelling ride:", error);
      Alert.alert("Failed to cancel ride", error?.response?.data?.message || error.message);
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
        snapPoints={[65]}
        closeOnOverlayClick={true}
        isKeyboardDismissable={true}
      >
        <ActionsheetBackdrop onPress={onClose} />
        <ActionsheetContent className="bg-white rounded-t-3xl">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <Box className={`${getStatusColor()} px-6 py-3 w-full`}>
            <Text className="text-white text-lg font-semibold text-center">
              {requestDetail?.requeststatus === "Pending"
                ? "Tracking driver in progress..."
                : requestDetail?.requeststatus === "Accepted"
                  ? "Driver accepted your request"
                  : requestDetail?.requeststatus === "Pickup"
                    ? "Driver is on the way"
                    : requestDetail?.requeststatus === "Processing"
                      ? "On rescue mission"
                      : "Completed"}
            </Text>
          </Box>
          <Box className="p-6">
            <Box className="flex-row items-center w-full mb-6">
              <Avatar
                size={80}
                rounded
                source={{
                  uri: "https://pbs.twimg.com/media/GEXDdESbIAAd5Qt?format=jpg&name=large",
                }}
                containerStyle={{ borderWidth: 2, borderColor: "#f2f2f2" }}
              />
              <Box className="ml-4 flex-1">
                <Text className="text-xl font-bold">
                  {requestDetail?.drivername || "Awaiting Driver"}
                </Text>
                <Text className="text-gray-600 mt-1">
                  {requestDetail?.brandname} {requestDetail?.licenseplate}
                </Text>
              </Box>
            </Box>
            <Box className="bg-gray-50 rounded-2xl p-4">
              <Box className="flex-row justify-between">
                <Box className="items-center flex-1 border-r border-gray-200">
                  <Box className="flex-row items-center">
                    <Clock size={20} color="#4B5563" />
                    <Text className="text-gray-600 ml-2">Time</Text>
                  </Box>
                  <Text className="text-xl font-bold mt-1">{eta}</Text>
                </Box>
                <Box className="items-center flex-1">
                  <Box className="flex-row items-center">
                    <Navigation2 size={20} color="#4B5563" />
                    <Text className="text-gray-600 ml-2">Distance</Text>
                  </Box>
                  <Text className="text-xl font-bold mt-1">{distance}</Text>
                </Box>
              </Box>
            </Box>
            {(requestDetail?.requeststatus === "Accepted" ||
              requestDetail?.requeststatus === "Pickup") &&
              renderProgressSteps()}
            <Box className="flex-row justify-between w-full mt-6">
              <Button variant="outline" size="md" onPress={handleCall}>
                <ButtonText>
                  <Phone size={18} color="#4B5563" style={{ marginTop: 2 }} /> Call
                </ButtonText>
              </Button>
              <Button variant="outline" size="md" onPress={toChatScreen}>
                <ButtonText>
                  <MessageSquare size={18} color="#4B5563" style={{ marginTop: 2 }} /> Chat
                </ButtonText>
              </Button>
              <Button variant="solid" size="md" className="bg-red-500" onPress={() => { }}>
                <ButtonText>
                  <AlertCircle size={18} color="#fff" style={{ marginTop: 2 }} /> SOS
                </ButtonText>
              </Button>
            </Box>
            {(requestDetail?.requeststatus === "Accepted" ||
              requestDetail?.requeststatus === "Pickup") && (
                <Box className="mt-4">
                  <Button onPress={() => setShowCancelActionsheet(true)} className="bg-red-500" size="md">
                    <ButtonText>Cancel Ride</ButtonText>
                  </Button>
                </Box>
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
        <ActionsheetContent className="bg-white rounded-t-3xl p-4">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <Text className="text-lg font-bold text-center mb-4">Cancel Ride</Text>
          <VStack space="md">
            <FormControl isRequired>
              <FormControlLabel>
                <FormControlLabelText>
                  Select a reason for cancellation
                </FormControlLabelText>
              </FormControlLabel>
              <RadioGroup
                value={selectedReason}
                onChange={(nextValue: React.SetStateAction<string>) => setSelectedReason(nextValue)}
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
                  <FormControlLabelText>Enter custom reason</FormControlLabelText>
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
                    <FormControlErrorText>Reason is required.</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
            <Button onPress={() => setShowCancelAlert(true)} className="bg-red-500" size="md">
              <ButtonText>Submit Cancellation</ButtonText>
            </Button>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>

      {/* AlertDialog xác nhận hủy chuyến */}
      <AlertDialog isOpen={showCancelAlert} onClose={() => setShowCancelAlert(false)} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Text className="text-lg font-bold">Confirm Cancellation</Text>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>Are you sure you want to cancel the ride?</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" action="secondary" size="sm" onPress={() => setShowCancelAlert(false)}>
              <ButtonText>Back</ButtonText>
            </Button>
            <Button size="sm" onPress={handleSubmitCancellation}>
              <ButtonText>Confirm</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TrackingActionSheet;
