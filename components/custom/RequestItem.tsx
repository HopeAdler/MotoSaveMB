import { acceptRequest } from "@/app/services/beAPI";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Router } from "expo-router";
import moment from "moment";
import { Alert, View } from "react-native";

interface RequestItem {
  requestid: string;
  servicepackagename: string;
  requestdetailid: string;
  requesttype: string;
  customername: string;
  customerphone: string;
  pickuplocation: string;
  requeststatus: string;
  createddate: string;
}

export const renderItem = ({
  item,
  token,
  router,
  pubnub,
  publishAcceptRequest,
}: {
  item: RequestItem;
  token: string;
  router: Router;
  pubnub: any; // Replace with proper PubNub type if using TypeScript
  publishAcceptRequest: (requestDetailId: string) => Promise<void>;
}) => (
  <Box className="bg-white p-4 mb-2 rounded-lg shadow relative">
    <Text className="text-violet-500 text-lg font-bold">{item.servicepackagename}</Text>
    <View className="absolute top-2 right-2 bg-blue-500 px-2 py-1 rounded-full">
      <Text className="text-white text-xs font-bold">{item.requeststatus}</Text>
    </View>
    <VStack space="sm">
      <Text className="text-lg font-bold">{item.customername}</Text>
      <Text className="text-gray-600">📞 {item.customerphone}</Text>
      <Text className="text-gray-700">📍 {item.pickuplocation}</Text>
      <Text className="text-gray-500">
        🕒 {moment(item.createddate).format("DD/MM/YYYY HH:mm")}
      </Text>
      {item.requeststatus === "Pending" ? (
        <Button
          className="bg-blue-500 p-2 rounded mt-2"
          onPress={async () => {
            if (!pubnub) {
              Alert.alert("Error", "PubNub is not initialized");
              return;
            }
            try {
              await acceptRequest(item.requestdetailid, token);
              try {
                await publishAcceptRequest(item.requestdetailid);
                Alert.alert("Success", "Request accepted and notification sent!");
              } catch (pubnubError) {
                Alert.alert("Warning", "Request accepted, but notification failed");
              }
            } catch (apiError) {
              Alert.alert("Error", "Failed to accept request");
            }
          }}
        >
          <Text className="text-white text-center">Accept</Text>
        </Button>
      ) : (
        <Button
          className="bg-green-500 p-2 rounded mt-2"
          onPress={() =>
            router.push({
              pathname: "/user/driver/requests/requestMap",
              params: { requestdetailid: item.requestdetailid.toString() },
            })
          }
        >
          <Text className="text-white text-center">Details</Text>
        </Button>
      )}
    </VStack>
  </Box>
);