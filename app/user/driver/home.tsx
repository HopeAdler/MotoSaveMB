import { AuthContext } from "@/app/context/AuthContext";
import { renderItem } from "@/components/custom/RequestItem";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Truck, MapPin, Clock, AlertCircle, LogOut } from "lucide-react-native";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, Pressable, View, ScrollView } from "react-native";
import { Avatar } from "react-native-elements";
import LoadingScreen from "../../loading/loading";
import { usePubNub } from "@/app/context/PubNubContext";
import { usePubNubService } from "@/app/services/pubnubService";
import { getPendingReturnRequest } from "@/app/services/beAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { B } from "@expo/html-elements";

// interface ServiceCardProps {
//   icon: LucideIcon;
//   title: string;
//   color: string;
// }

interface LocationProps {
  name: string;
  distance: string;
}

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

const ServiceCard = ({ icon: Icon, title, color }: {
  icon: React.ComponentType<any>;
  title: string;
  color: string;
}) => (
  <Pressable className="mr-4">
    <Box className="w-36 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <Box className="w-10 h-10 rounded-lg bg-blue-50 items-center justify-center mb-2">
        <Icon color={color} size={24} />
      </Box>
      <Text className="text-sm font-semibold text-gray-800">{title}</Text>
      <Text className="text-xs text-gray-500 mt-1">Xem chi tiết</Text>
    </Box>
  </Pressable>
);

export default function DHomeScreen() {
  const { user, dispatch, token } = useContext(AuthContext);
  const { pubnub } = usePubNub(); // Access PubNub instance from context
  const { publishAcceptRequest } = usePubNubService(); //
  const [isLoading, setIsLoading] = useState(true);
  const { jsonPendingReqDetailIds } = useLocalSearchParams<any>();
  const [pendingReqDetailIds, setPendingReqDetailIds] = useState(new Map<string, string>());
  const [pendingRescueRequests, setPendingRescueRequests] = useState<RequestItem[]>([]);
  const [pendingReturnRequests, setPendingReturnRequests] = useState<RequestItem[]>([]);
  const router = useRouter();
  // const testedIds = ['8f3e93cb-e458-494b-acc5-5e3dd601e709', '67b026f6-e114-4f32-9f61-fae96778a74e', 'e7a09360-6011-40f2-96d1-fac7d49e0093'];
  const fetchPendingRescueRequests = async () => {
    try {
      const requests = await Promise.all(
        Array.from(pendingReqDetailIds.values()).map(async (id) => {
          console.log(id)
          const response = await axios.get(
            `https://motor-save-be.vercel.app/api/v1/requests/driver/${id}`,
            { headers: { Authorization: "Bearer " + token } }
          );
          return response.data;
        })
      );

      // Filter out items where requeststatus is 'Accepted'
      const filteredRequests = requests
        .filter((item) => (item.requeststatus === "Pending"))
        .sort((a, b) => new Date(b.createddate).getTime() - new Date(a.createddate).getTime());
      setPendingRescueRequests(filteredRequests.slice(0, 2)); // ⬅️ Overwrite state with filtered data
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };
  const fetchPendingReturnRequest = async () => {
    try {
      const results = await getPendingReturnRequest(token);
      setPendingReturnRequests((prevReturnRequests) => {
        const isDataChanged = JSON.stringify(prevReturnRequests) !== JSON.stringify(results);
        return isDataChanged ? results : prevReturnRequests;
      });
    } catch (error) {
      console.error("Error fetching requests:", error);
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingReturnRequest(); // Fetch initially
      if (pendingReqDetailIds.size === 0) return; // No requests, skip API calls
      fetchPendingRescueRequests(); // Fetch every 5 seconds
    }, 5000);
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [pendingReqDetailIds, token]); // Dependencies to refetch when changed

  // Parse users from JSON and reconstruct the Map
  useEffect(() => {
    if (!user) return;
    setIsLoading(false);
    if (user.role !== "Driver") router.replace("/error/403");
  }, [user]);

  useEffect(() => {
    if (jsonPendingReqDetailIds) {
      const parsedObject = JSON.parse(jsonPendingReqDetailIds);
      setPendingReqDetailIds(new Map(Object.entries(parsedObject)));
    }
  }, [jsonPendingReqDetailIds]);

  if (isLoading) return <LoadingScreen />;

  const handleLogout = async () => {
    dispatch?.({ type: "LOGOUT" });
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Box className="bg-blue-600 px-6 pt-4 pb-6 shadow-lg">
        <Box className="flex-row items-center justify-between">
          <Box className="flex-row items-center">
            <Avatar
              size={52}
              rounded
              source={{ uri: "https://randomuser.me/api/portraits/men/36.jpg" }}
              containerStyle={{ borderWidth: 2, borderColor: 'white' }}
            />
            <Box className="ml-4">
              <Text className="text-white text-lg font-bold">Xin chào, {user?.username}</Text>
              <Text className="text-blue-100 text-sm">Trạng thái: Sẵn sàng</Text>
            </Box>
          </Box>
          <Button 
            variant="outline" 
            onPress={handleLogout}
            className="p-2"
          >
            <LogOut color="white" size={24} />
          </Button>
        </Box>
      </Box>

      <FlatList 
      className="flex-1 px-4"
      data={[]}
      showsVerticalScrollIndicator={false}
      keyExtractor={() => "main-scroll"}
      ListHeaderComponent={
        <>
        {/* Rescue Requests Section */}
        <Box className="bg-white rounded-2xl p-4 mt-4 shadow-sm">
          <Box className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-800">
              Yêu cầu cứu hộ
              <Text className="text-blue-600"> ({pendingRescueRequests?.length})</Text>
            </Text>
            <Clock color="#4b5563" size={18} />
          </Box>
          
          {pendingRescueRequests?.length > 0 ? (
            <FlatList
              pagingEnabled={true}
              data={pendingRescueRequests}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `${item.requestdetailid}-${item.requeststatus}`}
              renderItem={({ item }) => renderItem({ 
                item, 
                token, 
                router, 
                pubnub, 
                publishAcceptRequest 
              })}
            />
          ) : (
            <Box className="bg-blue-50 rounded-lg p-4 items-center">
              <AlertCircle color="#3b82f6" size={32} />
              <Text className="text-gray-600 mt-2 text-center">
                Hiện không có yêu cầu cứu hộ nào đang chờ
              </Text>
            </Box>
          )}
        </Box>

        {/* Return Requests Section */}
        <Box className="bg-white rounded-2xl p-4 mt-4 shadow-sm">
          <Box className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-800">
              Yêu cầu trả xe
              <Text className="text-green-600"> ({pendingReturnRequests?.length})</Text>
            </Text>
            <MapPin color="#4b5563" size={18} />
          </Box>

          {pendingReturnRequests?.length > 0 ? (
            <FlatList
              data={pendingReturnRequests}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `${item.requestdetailid}-${item.requeststatus}`}
              renderItem={({ item }) => renderItem({ 
                item, 
                token, 
                router, 
                pubnub, 
                publishAcceptRequest 
              })}
              ItemSeparatorComponent={() => <View className="w-4" />}
            />
          ) : (
            <Box className="bg-green-50 rounded-lg p-4 items-center">
              <Truck color="#10b981" size={32} />
              <Text className="text-gray-600 mt-2 text-center">
                Tất cả xe đã được trả đúng hẹn
              </Text>
            </Box>
          )}
        </Box>

        {/* Quick Actions Section */}
        <Box className="bg-white rounded-2xl p-4 mt-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Thao tác nhanh
          </Text>
          <View className="flex-row justify-between">
            <ServiceCard 
              icon={Truck} 
              title="Quản lý xe" 
              color="#3b82f6" 
            />
            <ServiceCard 
              icon={MapPin} 
              title="Vị trí hiện tại" 
              color="#10b981" 
            />
          </View>
        </Box>

        {/* Statistics Section */}
        <Box className="bg-white rounded-2xl p-4 mt-4 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Thống kê hôm nay
          </Text>
          <View className="flex-row justify-around">
            <Box className="items-center">
              <Text className="text-2xl font-bold text-blue-600">5</Text>
              <Text className="text-gray-600 text-sm">Yêu cầu</Text>
            </Box>
            <Box className="items-center">
              <Text className="text-2xl font-bold text-green-600">4.8</Text>
              <Text className="text-gray-600 text-sm">Đánh giá</Text>
            </Box>
            <Box className="items-center">
              <Text className="text-2xl font-bold text-purple-600">98%</Text>
              <Text className="text-gray-600 text-sm">Hài lòng</Text>
            </Box>
          </View>
        </Box>
        </>
      }
      renderItem={() => null}
      />
    </SafeAreaView>
  );
}

