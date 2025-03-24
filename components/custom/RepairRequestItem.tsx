import { acceptRepairRequest } from "@/app/services/beAPI";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Router } from "expo-router";
import moment from "moment";
import { Alert } from "react-native";
import { View } from "react-native";
import RequestStatus from "./RequestItemStatusComponent";

interface RepairRequestItem {
  requestid: string;
  customername: string;
  customerphone: string;
  requesttype: string;
  servicepackagename: string;
  requestdetailid: string;
  requeststatus: string;
  createddate: string;
}
export const renderRepairRequestItem = ({
  token,
  item,
  router
}: {
  token: string
  item: RepairRequestItem;
  router: Router;
}) => (
  <Box className="bg-white p-4 mb-2 rounded-lg shadow relative">
    <Text className="text-violet-500 text-lg font-bold">{item.servicepackagename}</Text>
    <RequestStatus requestStatus={item?.requeststatus} />
    <VStack space="sm">
      <Text className="text-lg font-bold">{item.customername}</Text>
      <Text className="text-gray-600">📞 {item.customerphone}</Text>
      <Text className="text-gray-500">
        🕒 {moment(item.createddate).format("DD/MM/YYYY HH:mm")}
      </Text>
      {item.requeststatus === "Pending" ?
        <Button
          className="bg-blue-500 p-2 rounded mt-2"
          onPress={async () => {
            try {
              await acceptRepairRequest(item.requestdetailid, token);
              Alert.alert("Success", "Request accepted and notification sent!");
            } catch (apiError) {
              Alert.alert("Error", "Failed to accept request");
            }
          }}
        >
          <Text className="text-white text-center">Accept</Text>
        </Button>
        :
        <Button
          className="bg-green-500 p-2 rounded mt-2"
          onPress={() =>
            router.push({
              pathname: "/user/mechanic/requests/repairRequestDetails",
              params: { requestDetailId: item.requestdetailid.toString(), requestId: item.requestid.toString() },
            })
          }
        >
          <Text className="text-white text-center">Details</Text>
        </Button>
      }
    </VStack>
  </Box>
);