import React from 'react';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { RefreshControl, VirtualizedList } from "react-native";
import { useState, useContext, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "@/app/context/AuthContext";
import { MapPin, Clock, AlertCircle } from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";
import { useRouter } from "expo-router";
import { StatusBadge } from "@/components/custom/StatusBadge";
import { formatDate, groupActivitiesByDate } from "@/app/utils/utils";

interface ActivityItem {
  requestid: string;
  drivername: string | null;
  driverphone: string | null;
  requesttype: string;
  requestdetailid: string;
  servicepackagename: string;
  pickuplocation: string;
  destination: string;
  requeststatus: string;
  createddate: string;
  staffid: string | null;
}

type ActivityGroup = [string, ActivityItem[]];
type ActivityData = ActivityGroup[];

const LoadingSkeleton = () => (
  <Box className="flex-1 bg-gray-50">
    <Box className="p-4">
      <Box className="h-8 w-48 bg-gray-200 rounded-lg mb-4 animate-pulse" />
      
      <Box className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Box 
            key={i} 
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <Box className="flex-row items-center justify-between mb-3">
              <Box>
                <Box className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                <Box className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </Box>
              <Box className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            </Box>

            <Box className="space-y-2">
              <Box className="flex-row items-center">
                <Box className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
                <Box className="h-4 flex-1 bg-gray-100 rounded ml-2 animate-pulse" />
              </Box>
              
              <Box className="flex-row items-center">
                <Box className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
                <Box className="h-4 flex-1 bg-gray-100 rounded ml-2 animate-pulse" />
              </Box>

              <Box className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <Box className="flex-row items-center">
                  <Box className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
                  <Box className="h-4 w-24 bg-gray-100 rounded ml-2 animate-pulse" />
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);

const INITIAL_BATCH_SIZE = 10;
const BATCH_SIZE = 5;

const ActivityCard = React.memo(({ activity, onPress }: { 
  activity: ActivityItem; 
  onPress: (id: string) => void;
}) => (
  <Pressable
    key={activity.requestdetailid}
    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 mb-2"
    onPress={() => onPress(activity.requestdetailid)}
    accessible={true}
    accessibilityLabel={`View details for ${activity.servicepackagename}`}
    accessibilityHint="Double tap to view request details"
  >
    <Box className="flex-row items-center justify-between mb-3">
      <Box>
        <Text className="text-base font-semibold text-gray-900">
          {activity.servicepackagename}
        </Text>
      </Box>
      <StatusBadge status={activity.requeststatus} />
    </Box>

    <Box className="space-y-2">
      <Box className="flex-row items-center">
        <MapPin size={16} color="#6B7280" />
        <Text className="text-gray-600 ml-2 flex-1 text-sm">
          From: {activity.pickuplocation}
        </Text>
      </Box>
      
      <Box className="flex-row items-center">
        <AlertCircle size={16} color="#6B7280" />
        <Text className="text-gray-600 ml-2 flex-1 text-sm">
          To: {activity.destination}
        </Text>
      </Box>

      <Box className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <Box className="flex-row items-center">
          <Clock size={16} color="#6B7280" />
          <Text className="text-gray-500 text-sm ml-2">
            {formatDate(activity.createddate)}
          </Text>
        </Box>

        {activity.drivername && (
          <Text className="text-sm text-gray-600">
            Driver: {activity.drivername}
          </Text>
        )}
      </Box>
    </Box>
  </Pressable>
));

const DateGroup = React.memo(({ date, activities, displayCount, onPress }: {
  date: string;
  activities: ActivityItem[];
  displayCount: number;
  onPress: (id: string) => void;
}) => (
  <Box className="px-4">
    <Box className="flex-row items-center mb-3">
      <Box className="h-px flex-1 bg-gray-200" />
      <Text className="text-sm font-semibold text-gray-600 px-3 bg-gray-50">
        {date}
      </Text>
      <Box className="h-px flex-1 bg-gray-200" />
    </Box>
    {activities.slice(0, displayCount).map((activity) => (
      <ActivityCard 
        key={activity.requestdetailid} 
        activity={activity} 
        onPress={onPress}
      />
    ))}
  </Box>
));

export default function ActivityScreen() {
  const { token } = useContext(AuthContext);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(INITIAL_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();

  const fetchActivities = async () => {
    try {
      const response = await axios.get(
        "https://motor-save-be.vercel.app/api/v1/requests/customer",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActivities(response.data);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setError("Failed to load activities. Pull to refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setDisplayCount(INITIAL_BATCH_SIZE);
    await fetchActivities();
    setRefreshing(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setDisplayCount(prev => prev + BATCH_SIZE);
    setIsLoadingMore(false);
  }, []);

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleActivityPress = useCallback((requestdetailid: string) => {
    router.push(`/user/customer/activity/requestDetails?requestdetailid=${requestdetailid}`);
  }, [router]);

  const sortedActivities = useMemo(() => {
    return activities.sort((a, b) => 
      new Date(b.createddate).getTime() - new Date(a.createddate).getTime()
    );
  }, [activities]);

  return (
    <Box className="flex-1 bg-gray-50">
      <Box className="bg-white-600 px-4 py-4">
        <Text 
          role="heading"
          aria-level={1}
          className="text-2xl font-bold text-black"
        >
          Activity
        </Text>
      </Box>

      {error && (
        <Box className="p-4 bg-red-50 rounded-lg mx-4 mb-4">
          <Text className="text-red-600">{error}</Text>
        </Box>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : activities.length === 0 ? (
        <Box className="items-center justify-center py-12">
          <Box className="rounded-full bg-gray-100 p-4 mb-4">
            <Clock size={32} color="#6B7280" />
          </Box>
          <Text className="text-gray-900 font-medium text-lg mb-1">
            No Activities Yet
          </Text>
          <Text className="text-gray-500 text-center">
            Your rescue request history will appear here
          </Text>
        </Box>
      ) : (
        <VirtualizedList<ActivityGroup>
          data={Object.entries(groupActivitiesByDate(sortedActivities)) as ActivityGroup[]}
          keyExtractor={(item: ActivityGroup) => item[0]}
          renderItem={({ item: [date, activities] }: { item: ActivityGroup }) => (
            <DateGroup
              date={date}
              activities={activities}
              displayCount={displayCount}
              onPress={handleActivityPress}
            />
          )}
          getItemCount={(data: ActivityData) => data.length}
          getItem={(data: ActivityData, index: number) => data[index]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          initialNumToRender={INITIAL_BATCH_SIZE}
          maxToRenderPerBatch={BATCH_SIZE}
          windowSize={5}
          removeClippedSubviews={true}
          className="flex-1"
        />
      )}
    </Box>
  );
}
