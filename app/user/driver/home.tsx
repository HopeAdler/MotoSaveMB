import { AuthContext } from "@/app/context/AuthContext";
import { usePubNub } from "@/app/context/PubNubContext";
import { getPendingReturnRequest } from "@/app/services/beAPI";
import { usePubNubService } from "@/app/services/pubnubService";
import { renderItem } from "@/components/custom/RequestItem";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, Bell, Clock, MapPin, Truck } from "lucide-react-native";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Avatar } from "react-native-elements";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingScreen from "../../loading/loading";
import { RequestItem } from "@/app/context/formFields";
import { CreateGuestRequest } from "@/components/custom/CreateGuestRequest";

// interface ServiceCardProps {
//   icon: LucideIcon;
//   title: string;
//   color: string;
// }

interface LocationProps {
  name: string;
  distance: string;
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
  const { jsonPendingReqDetailIds, jsonCurLoc = '{"latitude":0,"longitude":0}' } = useLocalSearchParams<any>();
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0, heading: 0 });
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

  useEffect(() => {
    try {
      setCurrentLoc(JSON.parse(jsonCurLoc));
      // console.log(jsonCurLoc)
    } catch (error) {
      console.error("Failed to parse jsonCurLoc:", error, jsonCurLoc);
      setCurrentLoc({ latitude: 0, longitude: 0, heading: 0 });
    }
  }, [jsonCurLoc]);

  if (isLoading) return <LoadingScreen />;

  const handleLogout = async () => {
    dispatch?.({ type: "LOGOUT" });
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Box className="bg-[#1a3148] pt-10 pb-5 rounded-b-[32px]">
        <Box className="px-5">
          <Box className="flex-row items-center justify-between mb-6">
            <Box className="flex-row items-center">
              <Box className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center mr-4 border border-white/20">
                {user?.avatar ?
                  <Avatar
                    size={52}
                    rounded
                    source={{ uri: user?.avatar }}
                    containerStyle={{ borderWidth: 2, borderColor: 'white' }}
                  />
                  :
                  <Text className="text-lg font-bold text-white">
                    {user?.username?.[0]?.toUpperCase()}
                  </Text>
                }
              </Box>
              <Box>
                <Text className="text-[#fab753] text-sm">Welcome back, Driver</Text>
                <Text className="text-white text-lg font-bold">
                  {user?.username}
                </Text>
              </Box>
            </Box>
            <Pressable className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center border border-white/20">
              <Bell color="#fab753" size={22} />
            </Pressable>
          </Box>
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

            {/* <CreateGuestRequest currentLoc={currentLoc}/> */}
            {/* <Box className="bg-white rounded-2xl p-4 mt-4 shadow-sm">
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
            </Box> */}

            {/* <Box className="bg-white rounded-2xl p-4 mt-4 mb-6 shadow-sm">
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
            </Box> */}
          </>
        }
        renderItem={() => null}
      />
    </SafeAreaView>
  );
}

