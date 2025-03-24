import { AuthContext } from "@/app/context/AuthContext";
import { usePubNub } from "@/app/context/PubNubContext";
import { usePubNubService } from "@/app/services/pubnubService";
import { renderItem } from "@/components/custom/RequestItem";
import { Box } from "@/components/ui/box";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ActivityIndicator, FlatList } from "react-native";

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

export default function DRequestScreen() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);
  const { pubnub } = usePubNub(); // Access PubNub instance from context
  const { publishAcceptRequest } = usePubNubService(); //
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<string>("Cứu hộ");
  const [filteredRequests, setFilteredRequests] = useState<RequestItem[]>([]);

  // Fetch requests function
  const fetchRequests = async (isInitialFetch = false) => {
    try {
      if (isInitialFetch) setLoading(true); // Only show loading on first fetch

      const response = await axios.get(
        "https://motor-save-be.vercel.app/api/v1/requests/driver",
        { headers: { Authorization: "Bearer " + token } }
      );

      // Prevent unnecessary state updates
      setRequests((prevRequests) => {
        const isDataChanged = JSON.stringify(prevRequests) !== JSON.stringify(response.data);
        return isDataChanged ? response.data : prevRequests;
      });

    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      if (isInitialFetch) setLoading(false);
    }
  };

  const handleRequestTypeChange = () => {
    switch (selectedRequestType) {
      case "Cứu hộ":
        setSelectedRequestType("Trả xe")
        break;
      case "Trả xe":
        setSelectedRequestType("Cứu hộ")
        break;
    }
  }
  useEffect(() => {
    setFilteredRequests(requests.filter(r => r.requesttype === selectedRequestType))
  }, [requests, selectedRequestType]);

  useEffect(() => {
    fetchRequests(true); // Initial fetch

    intervalRef.current = setInterval(() => {
      fetchRequests(false); // Subsequent fetches without resetting loading
    }, 5000); // Fetch every 5 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  return (
    <Box className="flex-1 bg-gray-100 p-4">
      <Pressable
        className="h-10 rounded-full flex flex-row items-center bg-gray-300 p-1"
        onPress={() => handleRequestTypeChange()}
      >
        <View
          className={`flex-1 h-full rounded-full flex items-center justify-center transition-all ${selectedRequestType === "Cứu hộ" ? 'bg-orange-500' : 'bg-transparent'}`}
        >
          <Text className={`text-lg font-bold ${selectedRequestType === "Cứu hộ" ? 'text-white' : 'text-gray-500'}`}>Cứu hộ</Text>
        </View>
        <View
          className={`flex-1 h-full rounded-full flex items-center justify-center transition-all ${selectedRequestType === "Trả xe" ? 'bg-yellow-500' : 'bg-transparent'}`}
        >
          <Text className={`text-lg font-bold ${selectedRequestType === "Trả xe" ? 'text-white' : 'text-gray-500'}`}>Trả xe</Text>
        </View>
      </Pressable>
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => `${item.requestdetailid}-${item.requeststatus}`}
        renderItem={({ item }) => renderItem({ item, token, router, pubnub, publishAcceptRequest })}
      />
    </Box>
  );
}
