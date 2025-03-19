import { AuthContext } from "@/app/context/AuthContext";
import { renderItem } from "@/components/custom/RequestItem";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  GalleryThumbnails,
  LucideIcon,
  MapPin,
  Truck
} from "lucide-react-native";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Avatar } from "react-native-elements";
import LoadingScreen from "../../loading/loading";
import { usePubNub } from "@/app/context/PubNubContext";
import { usePubNubService } from "@/app/services/pubnubService";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  color: string;
}

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

const ServiceCard: React.FC<ServiceCardProps> = ({
  icon: Icon,
  title,
  color,
}) => (
  <Pressable>
    <Box className="w-24 h-24 mx-2 bg-white rounded-lg shadow-sm">
      <Box className="p-4 flex items-center justify-center">
        <Icon color={color} size={32} />
        <Text className="text-xs text-center font-medium mt-2">{title}</Text>
      </Box>
    </Box>
  </Pressable>
);

const RecentLocation: React.FC<LocationProps> = ({ name, distance }) => (
  <Pressable>
    <Box className="flex flex-row items-center p-3 border-b border-gray-100">
      <MapPin className="text-gray-400 mr-3" size={20} />
      <Box className="flex-1">
        <Text className="font-medium">{name}</Text>
        <Text className="text-xs text-gray-500">{distance} away</Text>
      </Box>
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
  const [requestDetails, setRequestDetails] = useState<RequestItem[]>([]);
  const router = useRouter();
  // const testedIds = ['8f3e93cb-e458-494b-acc5-5e3dd601e709', '67b026f6-e114-4f32-9f61-fae96778a74e', 'e7a09360-6011-40f2-96d1-fac7d49e0093'];
  useEffect(() => {
    if (pendingReqDetailIds.size === 0) return; // No requests, skip API calls

    const fetchAllRequests = async () => {
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
        const filteredRequests = requests.filter((item) => (item.requeststatus === "Pending"));
        // console.log('Refetching..')
        setRequestDetails(filteredRequests); // ⬅️ Overwrite state with filtered data
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchAllRequests(); // Fetch initially

    const interval = setInterval(() => {
      fetchAllRequests(); // Fetch every 5 seconds
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
    <Box className="flex-1 bg-gray-50">
      <Box className="bg-blue-600 p-4 flex flex-row items-center justify-between">
        <Avatar
          size={64}
          rounded
          source={{ uri: "https://randomuser.me/api/portraits/men/36.jpg" }}
        />
        <Box className="flex w-3/4">
          <Text className="text-white text-lg font-bold">Xin chào lái xe: {user.username}</Text>
          <Button variant="outline" onPress={handleLogout}>
            <Text className="text-white">Đăng xuất</Text>
          </Button>
        </Box>
      </Box>

      <View className="flex-1">
        <Box className="p-4">
          <Box className="mb-3 h-2/5 flex flex-auto">
            <Text className="text-lg font-bold mb-4">Hàng chờ yêu cầu ({requestDetails?.length})</Text>
            {requestDetails && requestDetails.length > 0 ? (
              <FlatList
                data={requestDetails}
                keyExtractor={(item) => `${item.requestdetailid}-${item.requeststatus}`}
                renderItem={({ item }) =>
                  renderItem({ item, token, router, pubnub, publishAcceptRequest })
                }
              />
            ) : (
              <Text>Hiện chưa có yêu cầu nào</Text>
            )}
          </Box>

          <Box className="mb-3 h-1/4 flex flex-auto">
            <Text className="text-lg font-bold mb-4">Nghiệp vụ liên quan</Text>
            <Box className="flex flex-row flex-wrap">
              <ServiceCard icon={Truck} title="Xe cứu hộ" color="#8b5cf6" />
              <ServiceCard icon={GalleryThumbnails} title="Xe gửi tại trạm" color="#ff0000" />
            </Box>
          </Box>

          <Box className="mb-3 h-1/4 flex flex-auto">
            <Text className="text-lg font-bold mb-4">Yêu cầu đang thực hiện</Text>
            <Box className="bg-white rounded-lg shadow-sm">
              <RecentLocation name="Home" distance="0.5 km" />
              <RecentLocation name="Trạm của tôi" distance="2.3 km" />
              <Button
                variant="solid"
                className="bg-red-500 mb-4 m-8"
              // onPress={() => router.navigate("/user/customer/servicePackage")}
              >
                <Text className="text-lg font-bold text-white">
                  Trở lại trang yêu cầu
                </Text>
              </Button>
            </Box>
          </Box>
        </Box>
      </View>
    </Box >
  );
}

