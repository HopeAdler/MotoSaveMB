import { AuthContext } from "@/app/context/AuthContext";
import LoadingScreen from "@/app/loading/loading";
import {
  fetchStationOfAStaff,
  getPendingRepairRequests,
} from "@/app/services/beAPI";
import { renderRepairRequestItem } from "@/components/custom/RepairRequestItem";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import {
  Bell,
  GalleryThumbnails,
  LucideIcon,
  MapPinHouseIcon,
  Wrench,
} from "lucide-react-native";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { Avatar } from "react-native-elements";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  color: string;
}
interface Station {
  stationid: string;
  stationname: string;
  stationaddress: string;
  stationlong: number;
  stationlat: number;
}

interface StationProps {
  name: string;
  location: string;
}

interface RepairRequest {
  requestid: string;
  customername: string;
  customerphone: string;
  receivername: string;
  receiverphone: string;
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
      <MapPinHouseIcon color="blue" size={32} />
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
  const [loading, setLoading] = useState(false);
  const [pendingRepairRequests, setPendingRepairRequests] = useState<
    RepairRequest[]
  >([]);
  const [myStation, setMyStation] = useState<Station | null>();
  const fetchPendingRepairRequest = async (isInitialFetch = false) => {
    try {
      if (isInitialFetch) setLoading(true); // Only show loading on first fetch

      const results = await getPendingRepairRequests(token);
      setLoading(false);
      // Prevent unnecessary state updates
      setPendingRepairRequests((prevRepairRequests) => {
        const isDataChanged =
          JSON.stringify(prevRepairRequests) !== JSON.stringify(results);
        return isDataChanged ? results : prevRepairRequests;
      });
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      if (isInitialFetch) setLoading(false);
    }
  };
  const fetchMyStationn = async () => {
    try {
      const result = await fetchStationOfAStaff(token);
      setLoading(false);
      // Prevent unnecessary state updates
      setMyStation(result);
    } catch (error) {
      console.error("Error fetching station:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(true);
      fetchMyStationn();
      fetchPendingRepairRequest();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Box className="bg-[#1a3148] pt-10 pb-5 rounded-b-[32px] px-5 shadow-md">
          <Box className="flex-row items-center justify-between mb-6">
            <Box className="flex-row items-center">
              <Box className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center mr-4 border border-white/20">
                {user?.avatar ? (
                  <Avatar
                    size={52}
                    rounded
                    source={{ uri: user?.avatar }}
                    containerStyle={{ borderWidth: 2, borderColor: "white" }}
                  />
                ) : (
                  <Text className="text-lg font-bold text-white">
                    {user?.username?.[0]?.toUpperCase()}
                  </Text>
                )}
              </Box>
              <Box>
                <Text className="text-[#fab753] text-sm">
                  Chào mừng trở lại
                </Text>
                <Text className="text-white text-lg font-bold">
                  {user?.username}
                </Text>
              </Box>
            </Box>
            {/* <Pressable className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center border border-white/20">
              <Bell color="#fab753" size={22} />
            </Pressable> */}
          </Box>
        </Box>

        {/* Pending Requests */}
        <Box className="p-4">
          <Text className="text-lg font-bold mb-4">
            Hàng chờ yêu cầu ({pendingRepairRequests?.length})
          </Text>
          {pendingRepairRequests?.length > 0 ? (
            <FlatList
              data={pendingRepairRequests}
              keyExtractor={(item) =>
                `${item.requestdetailid}-${item.requeststatus}`
              }
              renderItem={({ item }) =>
                renderRepairRequestItem({ token, item, router })
              }
              scrollEnabled={false}
            />
          ) : (
            <Text className="text-gray-500 text-center">
              Hiện chưa có yêu cầu sửa xe nào
            </Text>
          )}
        </Box>

        {/* Related Services */}
        {/* <Box className="p-4">
          <Text className="text-lg font-bold mb-4">Nghiệp vụ liên quan</Text>
          <Box className="flex flex-row flex-wrap gap-4">
            <ServiceCard icon={Wrench} title="Sửa xe" color="#8b5cf6" />
            <ServiceCard
              icon={GalleryThumbnails}
              title="Xe gửi tại trạm"
              color="#ff0000"
            />
          </Box>
        </Box> */}

        {/* My Station */}
        <Box className="p-4">
          <Text className="text-lg font-bold mb-4">Trạm của tôi</Text>
          <Box className="bg-white rounded-lg shadow-sm p-4">
            <StationInfo
              name={myStation?.stationname || ""}
              location={myStation?.stationaddress || ""}
            />
            <Button
              variant="solid"
              className="bg-red-500 mt-4"
              onPress={() => router.navigate("/user/mechanic/requests/request")}
            >
              <Text className="text-lg font-bold text-white">
                Chuyển qua danh sách yêu cầu
              </Text>
            </Button>
          </Box>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
