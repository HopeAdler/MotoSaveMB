import React, { useState } from "react";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import { Actionsheet, ActionsheetContent } from "../ui/actionsheet";
import { Button, ButtonText } from "../ui/button";
import { ChevronDownIcon } from "lucide-react-native";
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectItem } from "../ui/select";


// const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");


interface TripDetailsActionSheetProps {
  isOpen: boolean;
  onPayment: () => void;
  fare: number | null;
  fareLoading: boolean;
  paymentLoading: boolean;
  directionsInfo: any;
  paymentMethodState: [string, React.Dispatch<React.SetStateAction<string>>];
}

const TripDetailsActionSheet: React.FC<TripDetailsActionSheetProps> = ({
  isOpen,
  onPayment,
  fare,
  fareLoading,
  paymentLoading,
  directionsInfo,
  paymentMethodState: [paymentMethod, setPaymentMethod],
}) => {
  return (
    <Actionsheet isOpen={isOpen} onClose={() => { }}>
      <ActionsheetContent className="bg-white rounded-t-xl">
        <Box className="p-4">
          <Text className="text-xl font-bold text-center">Trip Details</Text>
          <Box className="mt-4">
            <Text className="text-md">Distance: {directionsInfo?.distance?.text}</Text>
            <Text className="text-md mt-2">Duration: {directionsInfo?.duration?.text}</Text>
            <Text className="text-md mt-2">
              {fareLoading
                ? "Calculating fare..."
                : fare !== null
                  ? `Fare: ${fare.toLocaleString()} VND`
                  : "Fare: N/A"}
            </Text>
          </Box>

          {/* Payment Method Selection */}
          <Box className="mt-4">
            <Text className="text-md font-semibold mb-2">
              Payment Method
            </Text>
            <Select
              selectedValue={paymentMethod}
              onValueChange={(value: any) => setPaymentMethod(value)}
            >
              <SelectTrigger className="border border-gray-300 rounded-lg px-4 py-2 flex justify-between items-center">
                <SelectInput />
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
          <Box className="mt-4">
            <Button
              variant="solid"
              size="lg"
              onPress={onPayment}
              disabled={fareLoading || paymentLoading || fare === null}
            >
              <ButtonText>{paymentLoading ? "Processing..." : "Pay Now"}</ButtonText>
            </Button>
          </Box>
        </Box>
      </ActionsheetContent>
    </Actionsheet>
  );
};

export default TripDetailsActionSheet;
