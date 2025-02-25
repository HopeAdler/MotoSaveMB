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
} from "lucide-react-native";
import axios from "axios";
import AuthContext from "@/app/context/AuthContext";

interface TrackingActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  requestdetailid: string | null;
  eta: string;
  distance: string
}
interface RequestDetail {
  fullname: string;
  phone: string;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  requeststatus: string;
  drivername: string;
  driverphone: string;
  licenseplate: string;
  brandname: string;
  vehicletype: string;
  vehiclestatus: string;
}

const TrackingActionSheet: React.FC<TrackingActionSheetProps> = ({
  isOpen,
  onClose,
  requestdetailid,
  eta,
  distance,
}) => {
  const { token } = useContext(AuthContext);
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  // console.log("Request detail id: " + requestdetailid)

  const fetchRequestDetail = async () => {
    try {
      const response = await axios.get<RequestDetail>(
        `https://motor-save-be.vercel.app/api/v1/requests/driver/${requestdetailid}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      setRequestDetail(response.data);
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setLoading(false);
    }
  };
  // Fetch requests every 10 seconds
  useEffect(() => {
    fetchRequestDetail(); // Initial fetch

    const interval = setInterval(() => {
      fetchRequestDetail();
    }, 5000); // Fetch every 10 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

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
        <Box className="flex-row justify-between items-center">
          {steps.map((step, index) => (
            <Box key={step.status} className="items-center flex-1">
              <Box className="relative">
                <Box
                  className={`w-8 h-8 rounded-full ${
                    index <= currentStepIndex ? getStatusColor() : "bg-gray-200"
                  } items-center justify-center`}
                >
                  <CheckCircle2 size={16} color="white" />
                </Box>
                {index < steps.length - 1 && (
                  <Box
                    className={`h-0.5 w-full absolute top-1/2 left-full ${
                      index < currentStepIndex
                        ? getStatusColor()
                        : "bg-gray-200"
                    }`}
                    style={{ transform: [{ translateY: -1 }] }}
                  />
                )}
              </Box>
              <Text
                className={`text-xs mt-2 text-center ${
                  index <= currentStepIndex ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {step.title}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
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

        {/* Status Bar */}
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

        {/* Main Content Container */}
        <Box className="p-6">
          {/* Driver Info Section */}
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

          {/* Time and Distance Card */}
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

          {/* Progress Steps */}
          {requestDetail?.requeststatus !== "Pending" && renderProgressSteps()}

          {/* Action Buttons */}
          <Box className="flex-row justify-between w-full mt-6">
            <Button
              variant="outline"
              size="md"
              className="flex-1 mx-2 bg-gray-50 border-gray-200"
              onPress={() => {}}
            >
              <ButtonText className="flex-row items-center justify-center text-gray-700">
                <Box className="flex-row items-center">
                  <Phone size={18} color="#4B5563" style={{ marginTop: 2 }} />
                  <Text className="ml-2">Call</Text>
                </Box>
              </ButtonText>
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex-1 mx-2 bg-gray-50 border-gray-200"
              onPress={() => {}}
            >
              <ButtonText className="flex-row items-center justify-center text-gray-700">
                <Box className="flex-row items-center">
                  <MessageSquare
                    size={18}
                    color="#4B5563"
                    style={{ marginTop: 2 }}
                  />
                  <Text className="ml-2">Chat</Text>
                </Box>
              </ButtonText>
            </Button>
            <Button
              variant="solid"
              size="md"
              className="flex-1 mx-2 bg-red-500"
              onPress={() => {}}
            >
              <ButtonText className="flex-row items-center justify-center text-white">
                <Box className="flex-row items-center">
                  <AlertCircle
                    size={18}
                    color="#fff"
                    style={{ marginTop: 2 }}
                  />
                  <Text className="ml-2">SOS</Text>
                </Box>
              </ButtonText>
            </Button>
          </Box>
        </Box>
      </ActionsheetContent>
    </Actionsheet>
  );
};

export default TrackingActionSheet;
