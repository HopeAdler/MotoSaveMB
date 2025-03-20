import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import {
  AlertCircle,
  Car,
  CheckCircle2,
  Phone,
  User,
} from "lucide-react-native";
import axios from "axios";
import AuthContext from "@/app/context/AuthContext";
import { RepairRequestDetail } from "@/app/context/formFields";

const RepairRequestScreen = () => {
  const { requestid } = useLocalSearchParams<{
    requestid: string;
  }>();
  const { token } = useContext(AuthContext);
  const [requestDetail, setRequestDetail] =
    useState<RepairRequestDetail | null>(null);
  const fetchRequestDetail = async () => {
    try {
      const response = await axios.get<RepairRequestDetail>(
        `https://motor-save-be.vercel.app/api/v1/requests/repair/detail/${requestid}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      setRequestDetail(response.data);
    } catch (error) {
      console.error("Error fetching request details:", error);
    }
  };
  useEffect(() => {
    fetchRequestDetail();
    const interval = setInterval(fetchRequestDetail, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <Box className="flex-1 px-4 py-6">
      <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Mechanic Information
        </Text>
        <Box className="flex-row items-center">
          <User size={20} color="#6B7280" />
          <Box className="ml-3">
            <Text className="text-sm text-gray-500">Mechanic Name</Text>
            <Text className="text-base text-gray-900">
              {requestDetail?.mechanicname}
            </Text>
          </Box>
        </Box>

        <Box className="flex-row items-center">
          <Phone size={20} color="#6B7280" />
          <Box className="ml-3">
            <Text className="text-sm text-gray-500">Phone Number</Text>
            <Text className="text-base text-gray-900">
              {requestDetail?.mechanicphone}
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
      <Box className="flex-1 bg-white rounded-2xl shadow-sm p-4 mb-4"></Box>
    </Box>
  );
};

export default RepairRequestScreen;
