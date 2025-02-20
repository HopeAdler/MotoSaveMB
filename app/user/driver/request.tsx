import React, { useContext, useEffect, useState } from "react";
import { FlatList, ActivityIndicator, Alert, View } from "react-native";
import axios from "axios";
import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { useRouter } from "expo-router";

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

export default function DRequestScreen() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        "https://motor-save-be.vercel.app/api/v1/requests",
        { headers: { Authorization: "Bearer " + token } }
      );
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch requests every 20 seconds
  useEffect(() => {
    fetchRequests(); // Initial fetch

    const interval = setInterval(() => {
      fetchRequests();
    }, 20000); // Fetch every 20 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const acceptRequest = async (requestdetailid: string) => {
    try {
      await axios.put(
        `https://motor-save-be.vercel.app/api/v1/requests/${requestdetailid}/accept`,
        {},
        { headers: { Authorization: "Bearer " + token } }
      );
      Alert.alert("Success", "Request accepted!");
      fetchRequests(); // Refresh list after accepting
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", "Failed to accept request");
    }
  };

  const renderItem = ({ item }: { item: RequestItem }) => (
    <Box className="bg-white p-4 mb-2 rounded-lg shadow relative">
      <View className="absolute top-2 right-2 bg-blue-500 px-2 py-1 rounded-full">
        <Text className="text-white text-xs font-bold">
          {item.requeststatus}
        </Text>
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
            onPress={() => acceptRequest(item.requestdetailid.toString())}
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

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  return (
    <Box className="flex-1 bg-gray-100 p-4">
      <FlatList
        data={requests}
        keyExtractor={(item) => item.requestid.toString()}
        renderItem={renderItem}
      />
    </Box>
  );
}
