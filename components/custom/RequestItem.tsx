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
import { MapPin } from "lucide-react-native";

interface RequestItem {
  requestid: string;
  servicepackagename: string;
  requestdetailid: string;
  requesttype: string;
  customername: string;
  pickuplocation: string;
  requeststatus: string;
  createddate: string;
}

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
  <Box className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl mb-4 shadow-md border border-gray-200 h-64">
    <HStack className="justify-between items-start mb-5">
      <VStack className="flex-1 space-y-1">
        <Text className="text-lg font-semibold text-blue-800">
          {item.servicepackagename}
        </Text>
        <HStack className="justify-between items-center">
          <Text className="text-sm font-medium text-gray-500">
            {item.requesttype}
          </Text>
        </HStack>
      </VStack>
      <VStack className="items-end space-y-1">
        <Box className="bg-blue-500 px-3 py-1 rounded-full mb-1">
          <Text className="text-white text-sm font-semibold">
            {moment(item.createddate).format("HH:mm")}
          </Text>
        </Box>
        <StatusBadge status={item.requeststatus} variant={variant} />
      </VStack>
    </HStack>

    <VStack space="xs" className="mb-4">
      <HStack className="items-center space-x-2">
        <Text className="text-sm text-gray-700 font-medium">
          👤 {item.customername}
        </Text>
      </HStack>

      <HStack className="items-start space-x-2">
        <MapPin size={18} color="#2563EB" />
        <Text className="text-sm text-gray-700 flex-1 leading-5">
          {item.pickuplocation}
        </Text>
      </HStack>
    </VStack>

    <View className="mt-auto">
      {item.requeststatus === "Pending" ? (
        <Button
          variant="outline"
          className="bg-blue-500 hover:bg-blue-600 rounded-md h-12"
          onPress={async () => {
            if (!pubnub) {
              Alert.alert("Error", "PubNub is not initialized");
              return;
            }
            try {
              await acceptRequest(item.requestdetailid, token);
              try {
                if (item.requesttype !== "Trả xe") {
                  await publishAcceptRequest(item.requestdetailid);
                }
                Alert.alert(
                  "Success",
                  "Request accepted and notification sent!"
                );
              } catch (pubnubError) {
                Alert.alert(
                  "Warning",
                  "Request accepted, but notification failed"
                );
              }
            } catch (apiError) {
              Alert.alert("Error", "Failed to accept request");
            }
          }}
        >
          <ButtonText className="text-white text-base font-semibold">
            Accept
          </ButtonText>
        </Button>
      ) : (
        <Button
          variant="outline"
          className="border-gray-300 rounded-md h-12 hover:border-gray-400"
          onPress={() =>
            router.push({
              pathname: "/user/driver/requests/requestMap",
              params: { requestdetailid: item.requestdetailid.toString() },
            })
          }
        >
          <HStack className="items-center space-x-2 h-full justify-center">
            <Text className="text-blue-500 text-base font-semibold">
              View Details
            </Text>
          </HStack>
        </Button>
      )}
    </View>
  </Box>
);
