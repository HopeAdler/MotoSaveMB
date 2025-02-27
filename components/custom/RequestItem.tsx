import { acceptRequest } from "@/app/services/beAPI";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import moment from "moment";
import { View } from "react-native";

interface RequestItem {
    requestid: string;
    requestdetailid: string;
    requesttype: string;
    fullname: string;
    phone: string;
    pickuplocation: string;
    requeststatus: string;
    createddate: string;
}

export const renderItem = ({ item, token, router }: { item: RequestItem; token: string; router: any }) => (
    <Box className="bg-white p-4 mb-2 rounded-lg shadow relative">
        <View className="absolute top-2 right-2 bg-blue-500 px-2 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">{item.requeststatus}</Text>
        </View>
        <VStack space="sm">
            <Text className="text-lg font-bold">{item.fullname}</Text>
            <Text className="text-gray-600">📞 {item.phone}</Text>
            <Text className="text-gray-700">📍 {item.pickuplocation}</Text>
            <Text className="text-gray-500">
                🕒 {moment(item.createddate).format("DD/MM/YYYY HH:mm")}
            </Text>
            {item.requeststatus === "Pending" ? (
                <Button
                    className="bg-blue-500 p-2 rounded mt-2"
                    onPress={() => acceptRequest(item.requestdetailid.toString(), token)}
                >
                    <Text className="text-white text-center">Accept</Text>
                </Button>
            ) : (
                <Button
                    className="bg-green-500 p-2 rounded mt-2"
                    onPress={() =>
                        router.push({
                            pathname: "/user/driver/requestMap",
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

