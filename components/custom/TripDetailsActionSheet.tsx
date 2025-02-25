import React from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { View, ActivityIndicator } from "react-native";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "../ui/button";
import { ChevronDownIcon, Navigation2, Clock } from "lucide-react-native";
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectItem } from "../ui/select";

interface TripDetailsActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: () => void;
  fare: number | null;
  fareLoading: boolean;
  paymentLoading: boolean;
  directionsInfo: any;
  paymentMethodState: [string, React.Dispatch<React.SetStateAction<string>>];
}

const TripDetailsActionSheet: React.FC<TripDetailsActionSheetProps> = ({
  isOpen,
  onClose,
  onPayment,
  fare,
  fareLoading,
  paymentLoading,
  directionsInfo,
  paymentMethodState: [paymentMethod, setPaymentMethod],
}) => {
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop onPress={onClose} />
      <ActionsheetContent className="bg-white rounded-t-3xl">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator className="bg-gray-300 rounded-full w-10 h-1 mx-auto my-2" />
        </ActionsheetDragIndicatorWrapper>

        <Box className="px-6 py-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-center">Trip Details</Text>
        </Box>

        <Box className="p-6">
          {fareLoading ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <>
              {/* Time and Distance Card */}
              <Box className="bg-gray-50 rounded-2xl p-4">
                <Box className="flex-row justify-between">
                  {/* Duration Section */}
                  <Box className="w-[50%] items-center border-r border-gray-200">
                    <Box className="flex-row items-center">
                      <Clock size={20} color="#4B5563" />
                      <Text className="text-gray-600 ml-2">Duration</Text>
                    </Box>
                    <Text className="text-xl font-bold mt-1">
                      {directionsInfo?.duration?.text}
                    </Text>
                  </Box>

                  {/* Distance Section */}
                  <Box className="w-[50%] items-center">
                    <Box className="flex-row items-center">
                      <Navigation2 size={20} color="#4B5563" />
                      <Text className="text-gray-600 ml-2">Distance</Text>
                    </Box>
                    <Text className="text-xl font-bold mt-1">
                      {directionsInfo?.distance?.text}
                    </Text>
                  </Box>
                </Box>
              </Box>

              <Box className="bg-blue-50 rounded-2xl p-4 mt-4">
                <Box className="items-center">
                  <Text className="text-gray-600 mb-1">Estimated Fare</Text>
                  <Text className="text-2xl font-bold text-blue-600">
                    {fare?.toLocaleString()} VND
                  </Text>
                </Box>
              </Box>

              <Box className="mt-4">
                <Text className="text-gray-600 mb-2">Payment Method</Text>
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

              <Button
                variant="solid"
                size="lg"
                onPress={onPayment}
                disabled={fareLoading || paymentLoading || fare === null}
                className="bg-blue-600 h-14 rounded-xl mt-4"
              >
                <ButtonText className="text-lg font-semibold">
                  {paymentLoading ? "Processing..." : "Confirm Booking"}
                </ButtonText>
              </Button>
            </>
          )}
        </Box>
      </ActionsheetContent>
    </Actionsheet>
  );
};

export default TripDetailsActionSheet;
