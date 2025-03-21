import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import {
  AlertCircle,
  Car,
  CheckCircle2,
  ChevronDownIcon,
  Phone,
  User,
} from "lucide-react-native";
import { FlatList, Pressable, ScrollView } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { getAutocomplete } from "@/app/services/goongAPI";
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
import { RepairQuote } from "@/app/context/formFields";
import axios from "axios";

// Fake Repair Quote Data
// const repairQuotes = [
//   {
//     id: "1",
//     repairname: "Brake Repair",
//     detail: "Replace brake pads",
//     cost: 500000,
//   },
//   {
//     id: "2",
//     repairname: "Oil Change",
//     detail: "Change engine oil",
//     cost: 300000,
//   },
//   {
//     id: "3",
//     repairname: "Battery Replacement",
//     detail: "Replace car battery",
//     cost: 800000,
//   },
// ];

// Calculate Total Price
// const totalPrice = repairQuotes.reduce((sum, item) => sum + item.cost, 0);

const RepairScreen = () => {
  // const { requestid } = useLocalSearchParams<{
  //   requestid: string;
  // }>();
  // console.log(requestid);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [destinationSelected, setDestinationSelected] = useState(false);
  const [originCoordinates, setOriginCoordinates] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [repairQuotes, setRepairQuotes] = useState<RepairQuote[]>([]);
  const fetchRepairQuote = async () => {
    try {
      const response = await axios.get<RepairQuote[]>(
        "https://motor-save-be.vercel.app/api/v1/repairquotes/requestdetail/8f575ef5-7dfa-438f-bcb8-931882ee99ae",
      );
      setRepairQuotes(response.data);
    } catch (error) {
      console.error("Error fetching request details:", error);
    }
  };
  useEffect(() => {
    fetchRepairQuote();
  }, []);
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
  const [status, setStatus] = useState("Pending");
  const getStatusColor = () => {
    switch (status) {
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

    const currentStepIndex = steps.findIndex((step) => step.status === status);

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
      <Box className="flex-1 px-4 py-6">
        <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Mechanic Information
          </Text>
          <Box className="flex-row justify-between items-center">
            <Box>
              <Box className="flex-row items-center">
                <User size={20} color="#6B7280" />
                <Box className="ml-3">
                  <Text className="text-sm text-gray-500">Mechanic Name</Text>
                  <Text className="text-base text-gray-900">Nguyen Van A</Text>
                </Box>
              </Box>

              <Box className="flex-row items-center">
                <Phone size={20} color="#6B7280" />
                <Box className="ml-3">
                  <Text className="text-sm text-gray-500">Phone Number</Text>
                  <Text className="text-base text-gray-900">0947424890</Text>
                </Box>
              </Box>
            </Box>
            <Box>
              <Box className="flex-row items-center">
                <Car size={20} color="#6B7280" />
                <Box className="ml-3">
                  <Text className="text-sm text-gray-500">Station</Text>
                  <Text className="text-base text-gray-900">Station 1</Text>
                </Box>
              </Box>
              <Box className="flex-row items-center">
                <AlertCircle size={20} color="#6B7280" />
                <Box className="ml-3">
                  <Text className="text-sm text-gray-500">Address</Text>
                  <Text className="text-base text-gray-900">58 Võ Văn Hát</Text>
                </Box>
              </Box>
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
        <Box className="flex-1 bg-white rounded-2xl shadow-sm p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Repair Quote
          </Text>

          <FlatList
            data={repairQuotes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Box className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Box>
                  <Text className="text-base font-medium text-gray-900">
                    {item.repairname}
                  </Text>
                  <Text className="text-sm text-gray-500">{item.detail}</Text>
                </Box>
                <Text className="text-base font-semibold text-gray-900">
                  {item.cost.toLocaleString()} VND
                </Text>
              </Box>
            )}
          />

          {/* Total Price */}
          <Box className="flex-row justify-between items-center my-4 border-t border-gray-300 pt-3">
            <Text className="text-lg font-semibold text-gray-900">
              Total Price
            </Text>
            <Text className="text-lg font-bold text-red-500">
               2.000.000VND
            </Text>
          </Box>

          {/* Return vehicle location */}
          <Box className="mt-2">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
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
          {destinationResults.length > 0 && (
            <FlatList
              data={destinationResults}
              keyExtractor={(_item, index) => index.toString()}
              className="bg-white rounded max-h-40"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setDestinationQuery(item.description);
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
            <Text className="text-lg font-semibold text-gray-900 mb-2">
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
              onPress={() => console.log("Confirm Pressed")}
            >
              <ButtonText className="text-white">Confirm</ButtonText>
            </Button>
          </Box>
        </Box>
      </Box>
    </ScrollView>
  );
};

export default RepairScreen;
