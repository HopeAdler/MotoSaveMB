import AuthContext from "@/app/context/AuthContext";
import { getRepairRequestsByMechanic } from "@/app/services/beAPI";
import { renderRepairRequestItem } from "@/components/custom/RepairRequestItem";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { FlatList, RefreshControl } from "react-native";

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

const RequestLoadingSkeleton = () => (
  <Box className="flex-1 bg-[#f1f5f9]">
    <Box className="bg-white p-5 shadow-sm mb-4">
      <Box className="flex-row items-center justify-between mb-2">
        <Box className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <Box className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
      </Box>
    </Box>

    <Box className="px-4">
      {[1, 2, 3].map((i) => (
        <Box 
          key={i} 
          className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100/50"
        >
          <Box className="flex-row items-center justify-between mb-3">
            <Box className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <Box className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
          </Box>

          <Box className="flex-row items-center mb-3">
            <Box className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse mr-3" />
            <Box className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          </Box>

          <Box className="space-y-2 mb-4">
            <Box className="flex-row items-center">
              <Box className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
              <Box className="h-4 w-40 bg-gray-100 rounded ml-2 animate-pulse" />
            </Box>
            
            <Box className="flex-row items-center">
              <Box className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
              <Box className="h-4 w-32 bg-gray-100 rounded ml-2 animate-pulse" />
            </Box>
          </Box>

          <Box className="h-12 bg-gray-200 rounded-xl animate-pulse" />
        </Box>
      ))}
    </Box>
  </Box>
);

export default function MRequestScreen() {
  const { token } = useContext(AuthContext);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRepairRequest = useCallback(async (isInitialFetch = false) => {
    try {
      if (isInitialFetch) setLoading(true);

      const results = await getRepairRequestsByMechanic(token);

      setRepairRequests((prevRepairRequests) => {
        const isDataChanged = JSON.stringify(prevRepairRequests) !== JSON.stringify(results);
        return isDataChanged ? results : prevRepairRequests;
      });
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      if (isInitialFetch) setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRepairRequest(true);
  }, [fetchRepairRequest]);

  useEffect(() => {
    fetchRepairRequest(true);

    intervalRef.current = setInterval(() => {
      fetchRepairRequest(false);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchRepairRequest]);

  const renderItem = useCallback(({ item }: { item: RepairRequest }) => 
    renderRepairRequestItem({ token, item, router })
  , [token, router]);

  if (loading) {
    return <RequestLoadingSkeleton />;
  }

  return (
    <Box className="flex-1 bg-[#f1f5f9]">
      <Box className="bg-white p-5 shadow-sm">
        <Box className="flex-row items-center justify-between mb-2">
          <Box>
            <Text className="text-[#1a3148] text-xl font-bold">Repair Requests</Text>
          </Box>
        </Box>
      </Box>

      <FlatList
        className="px-4 pt-4"
        data={repairRequests}
        keyExtractor={(item) => `${item.requestdetailid}-${item.requeststatus}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#fab753"]}
            tintColor="#fab753"
          />
        }
        ListEmptyComponent={
          <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50 mt-4 items-center justify-center">
            <Text className="text-[#1a3148] text-base font-medium">No repair requests available</Text>
          </Box>
        }
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
      />
    </Box>
  );
}
