import { AuthContext } from "@/app/context/AuthContext";
import { getPendingRepairRequests } from "@/app/services/beAPI";
import { renderRepairRequestItem } from "@/components/custom/RepairRequestItem";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import axios from "axios";
import { router } from "expo-router";
import {
  GalleryThumbnails,
  LucideIcon,
  MapPinHouseIcon,
  Wrench
} from "lucide-react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { Avatar } from "react-native-elements";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  color: string;
}

interface StationProps {
  name: string;
  location: string;
}

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

const StationInfo: React.FC<StationProps> = ({ name, location }) => (
  <Pressable>
    <Box className="flex flex-row items-center p-3 border-b border-gray-100">
      <MapPinHouseIcon color='blue' size={32} />
      <Box className="ml-5 flex-1">
        <Text className="font-medium">{name}</Text>
        <Text className="text-xs text-gray-500">{location} away</Text>
      </Box>
    </Box>
  </Pressable>
);

// const pendingRepairRequest = dummyRepairRequests.filter(r => r.requeststatus === "Pending")
export default function MHomeScreen() {
  const { user, dispatch, token } = useContext(AuthContext);
  const handleLogout = async () => {
    dispatch?.({ type: "LOGOUT" });
    router.replace("/auth/login");
  };
  const [loading, setLoading] = useState(true);
  const [pendingRepairRequests, setPendingRepairRequests] = useState<RepairRequest[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPendingRepairRequest = async (isInitialFetch = false) => {
    try {
      if (isInitialFetch) setLoading(true); // Only show loading on first fetch

      const results = await getPendingRepairRequests(token);

      // Prevent unnecessary state updates
      setPendingRepairRequests((prevRepairRequests) => {
        const isDataChanged = JSON.stringify(prevRepairRequests) !== JSON.stringify(results);
        return isDataChanged ? results : prevRepairRequests;
      });

    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      if (isInitialFetch) setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingRepairRequest(); // Fetch every 5 seconds
    }, 5000);

    return () => clearInterval(interval); 
  }, []);

  return (
    <Box className="flex-1 bg-gray-50">
      <Box className="bg-blue-600 p-4 flex flex-row items-center justify-between">
        <Avatar
          size={64}
          rounded
          source={{ uri: "https://randomuser.me/api/portraits/men/36.jpg" }}
        />
        <Box className="flex w-3/4">
          <Text className="text-white text-lg font-bold">Xin chào thợ máy: {user.username}</Text>
          <Button variant="outline" onPress={handleLogout}>
            <Text className="text-white">Đăng xuất</Text>
          </Button>
        </Box>
      </Box>

      <View className="flex-1">
        <Box className="p-4">
          <Box className="mb-3 h-2/5 flex flex-auto">
            <Text className="text-lg font-bold mb-4">Hàng chờ yêu cầu ({pendingRepairRequests?.length})</Text>
            {pendingRepairRequests && pendingRepairRequests.length > 0 ? (
              <FlatList
                data={pendingRepairRequests}
                keyExtractor={(item) => `${item.requestdetailid}-${item.requeststatus}`}
                renderItem={({ item }) =>
                  renderRepairRequestItem({ token, item, router })
              }
              />
            ) : (
              <Text>Hiện chưa có yêu cầu sửa xe nào</Text>
            )}
          </Box>

          <Box className="mb-3 h-1/4 flex flex-auto">
            <Text className="text-lg font-bold mb-4">Nghiệp vụ liên quan</Text>
            <Box className="flex flex-row flex-wrap">
              <ServiceCard icon={Wrench} title="Sửa xe" color="#8b5cf6" />
              <ServiceCard icon={GalleryThumbnails} title="Xe gửi tại trạm" color="#ff0000" />
            </Box>
          </Box>

          <Box className="mb-3 h-1/4 flex flex-auto">
            <Text className="text-lg font-bold mb-4">Trạm của tôi</Text>
            <Box className="bg-white rounded-lg shadow-sm">
              <StationInfo name="Trạm 1" location="Số X, đường Y, phố Z" />
              <Button
                variant="solid"
                className="bg-red-500 mb-4 m-8"
              // onPress={() => router.navigate("/user/customer/servicePackage")}
              >
                <Text className="text-lg font-bold text-white">
                  Chuyển qua danh sách yêu cầu
                </Text>
              </Button>
            </Box>
          </Box>
        </Box>
      </View>
    </Box >
  );
}

