import React, { useContext, useEffect, useState, useRef } from "react";
import { FlatList, ActivityIndicator, Alert, View } from "react-native";
import axios from "axios";
import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { useRouter } from "expo-router";
import { renderItem } from "@/components/custom/RequestItem";

interface RequestItem {
  requestid: string;
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
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch requests every 20 seconds
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
      <FlatList
        data={requests}
        keyExtractor={(item) => `${item.requestdetailid}-${item.requeststatus}`}
        renderItem={({ item }) => renderItem({ item, token, router })}
      />
    </Box>
  );
}
