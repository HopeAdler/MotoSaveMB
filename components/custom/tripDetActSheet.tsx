import React from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Actionsheet, ActionsheetContent } from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";

interface TripDetailsActionSheetProps {
  isOpen: boolean;
  onPayment: () => void;
  fare: number | null;
  fareLoading: boolean;
  paymentLoading: boolean;
  directionsInfo: any;
}

const TripDetailsActionSheet: React.FC<TripDetailsActionSheetProps> = ({
  isOpen,
  onPayment,
  fare,
  fareLoading,
  paymentLoading,
  directionsInfo,
}) => {
  return (
    <Actionsheet isOpen={isOpen} onClose={() => {}}>
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
