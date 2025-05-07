import { acceptRequest } from "@/app/services/beAPI";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { StatusBadge } from "@/components/custom/StatusBadge";
import { Router } from "expo-router";
import moment from "moment";
import { Alert, View } from "react-native";
import { MapPin, User, Navigation2 } from "lucide-react-native";
import { RequestItem } from "@/app/context/formFields";

interface RequestItemProps {
  item: RequestItem;
  token: string;
  router: Router;
  pubnub: any;
  publishAcceptRequest: (requestDetailId: string) => Promise<void>;
  variant?: "default" | "large" | "banner" | "small";
}

export const renderItem = ({
  item,
  token,
  router,
  pubnub,
  publishAcceptRequest,
  variant = "small",
}: RequestItemProps) => (
  <Box className="bg-white rounded-xl mb-4 shadow-sm border border-gray-100/50 overflow-hidden">
    <Box className="p-5">
      <HStack className="justify-between items-start mb-5">
        <VStack className="flex-1 space-y-1">
          <Text className="text-lg font-bold text-[#1a3148]">
            {item.servicepackagename}
          </Text>
          <Text className="text-sm font-medium text-gray-500">
            {item.requesttype}
          </Text>
        </VStack>
        <VStack className="items-end space-y-1 gap-1">
          <Box className="bg-[#1a3148]/10 px-3 py-1 rounded-full">
            <Text className="text-[#1a3148] text-xs font-medium">
              {moment(item.createddate).format("HH:mm")}
            </Text>
          </Box>
          <StatusBadge status={item.requeststatus} variant={variant} />
        </VStack>
      </HStack>

      <Box className="space-y-4">
        <HStack className="items-center space-x-3">
          <Box className="w-10 h-10 bg-[#1a3148]/5 rounded-lg items-center justify-center">
            <User size={20} color="#1a3148" />
          </Box>
          <Text className="text-base text-[#1a3148] ml-2 font-medium">
            {item.customername ? item.customername : item.receivername}
          </Text>
        </HStack>

        {item.requesttype === 'Cứu hộ' && (
          <HStack className="items-start space-x-3 mt-1">
            <Box className="w-10 h-10 bg-[#1a3148]/5 rounded-lg items-center justify-center">
              <MapPin size={20} color="#1a3148" />
            </Box>
            <Text className="text-base text-gray-600 ml-2 flex-1 leading-5 pt-1">
              {item.pickuplocation}
            </Text>
          </HStack>
        )}

        {item.destination && (
          <HStack className="items-start space-x-3 mt-1">
            <Box className="w-10 h-10 bg-[#fab753]/10 rounded-lg items-center justify-center">
              <Navigation2 size={20} color="#fab753" />
            </Box>
            <Text className="text-base text-gray-600 ml-2 flex-1 leading-5 pt-1">
              {item.destination}
            </Text>
          </HStack>
        )}
      </Box>

      <Box className="mt-5 pt-4 border-t border-gray-100">
        {item.requeststatus === "Pending" ? (
          <Button
            variant="solid"
            className="bg-[#fab753] rounded-xl h-12 active:opacity-80"
            onPress={async () => {
              if (!pubnub) {
                Alert.alert("Error", "PubNub is not initialized");
                return;
              }
              try {
                // Wait for acceptRequest to complete and return a result
                const result = await acceptRequest(item.requestdetailid, token);
                // If there is a valid result, proceed to publishAcceptRequest
                if (result && item.requesttype !== "Trả xe") {
                  try {
                    await publishAcceptRequest(item.requestdetailid);
                    Alert.alert("Success", "Đã chấp nhận yêu cầu cứu hộ!");
                    router.push({
                      pathname: "/user/driver/map"})
                  } catch (pubnubError) {
                    Alert.alert("Warning", "Request accepted, but notification failed");
                  }
                } else {
                  Alert.alert("Success", "Đã chấp nhận yêu cầu trả xe!");
                  router.push({
                    pathname: "/user/driver/map"})
                }
              } catch (apiError: any) {
                Alert.alert("Error", apiError.message);
              }
            }}
          >
            <ButtonText className="text-[#1a3148] font-bold">
              Chấp nhận
            </ButtonText>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-[#1a3148] rounded-xl h-12 active:opacity-80"
            onPress={() => {
              console.log(item.requestdetailid.toString())
              router.push({
                pathname: "/user/driver/requests/requestMap",
                params: { requestdetailid: item.requestdetailid.toString() },
              })
            }}
          >
            <HStack className="items-center space-x-2 h-full justify-center">
              <Text className="text-[#1a3148] font-semibold">
                Xem chi tiết
              </Text>
            </HStack>
          </Button>
        )}
      </Box>
    </Box>
  </Box>
);
