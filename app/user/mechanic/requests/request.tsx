import AuthContext from "@/app/context/AuthContext";
import { getRepairRequestsByMechanic } from "@/app/services/beAPI";
import { renderRepairRequestItem } from "@/components/custom/RepairRequestItem";
import { Box } from "@/components/ui/box";
// import axios from "axios";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";

interface RepairRequest {
  requestid: string;
  customername: string;
  customerphone: string;
  requesttype: string;
  servicepackagename: string;
  requestdetailid: string;
  stationid: string;
  requeststatus: string;
  createddate: string;
}
export default function MRequestScreen() {
  const { token } = useContext(AuthContext);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  //   const [loading, setLoading] = useState(true);
  // const { token } = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRepairRequest = async (isInitialFetch = false) => {
    try {
      if (isInitialFetch) setLoading(true); // Only show loading on first fetch

      const results = await getRepairRequestsByMechanic(token);

      // Prevent unnecessary state updates
      setRepairRequests((prevRepairRequests) => {
        const isDataChanged = JSON.stringify(prevRepairRequests) !== JSON.stringify(results);
        return isDataChanged ? results : prevRepairRequests;
      });

    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      if (isInitialFetch) setLoading(false);
    }
  };

  // Fetch requests every 20 seconds
  useEffect(() => {
    fetchRepairRequest(true); // Initial fetch

    intervalRef.current = setInterval(() => {
      fetchRepairRequest(false); // Subsequent fetches without resetting loading
    }, 5000); // Fetch every 5 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  return (
    <Box className="flex-1 bg-gray-100 p-4">
      <FlatList
        data={repairRequests}
        keyExtractor={(item) => `${item.requestdetailid}-${item.requeststatus}`}
        renderItem={({ item }) => renderRepairRequestItem({ token, item, router })}
      />
    </Box>
  );
}
