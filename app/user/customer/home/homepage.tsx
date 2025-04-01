import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { ScrollView, Pressable } from "react-native";
import {
  Car,
  Ambulance,
  Wrench,
  Battery,
  Fuel,
  Search,
  Bell,
} from "lucide-react-native";
import { router } from "expo-router";
import LoadingScreen from "../../../loading/loading";
import { RequestContext } from "@/app/context/RequestContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface ServiceCardProps {
  icon: React.ElementType;
  title: string;
  color: string;
  onPress: () => void;
}

interface LatestRequestDetail {
  requestdetailid: string;
  requeststatus: string;
  createddate: string;
  updateddate: string;
  requestid: string;
  servicepackagename: string;
  requesttype: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon: Icon, title, color, onPress }) => (
  <Pressable onPress={onPress} className="mr-3">
    <Box className="w-[150px] bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <Box
        className="w-12 h-12 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon color={color} size={24} />
      </Box>
      <Text className="text-[15px] font-semibold text-[#1a3148]">{title}</Text>
      <Text className="text-xs text-gray-500">Available 24/7</Text>
    </Box>
  </Pressable>
);

export default function CHomeScreen() {
  const { user, token } = useContext(AuthContext);
  const { requestId } = useContext(RequestContext);
  const [latestRequestDetail, setLatestRequestDetail] =
    useState<LatestRequestDetail>();
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequestDetail = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<LatestRequestDetail>(
        `https://motor-save-be.vercel.app/api/v1/requests/latestRequestDetail/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLatestRequestDetail(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching request details:", error);
    }
  };

  useEffect(() => {
    if (requestId !== null) {
      fetchRequestDetail();
    }
  }, []);

  if (!user) {
    router.replace("/auth/login");
    return null;
  }

  if (user.role !== "Customer") {
    router.replace("/error/403");
    return null;
  }

  const handleNavigate = () => {
    if (
      latestRequestDetail?.servicepackagename === "Cứu hộ thường" &&
      latestRequestDetail?.requesttype === "Cứu hộ"
    ) {
      router.navigate("/user/customer/home/normalRescue/normalRescueMap");
    } else if (
      latestRequestDetail?.servicepackagename === "Cứu hộ nước ngập" &&
      latestRequestDetail?.requesttype === "Cứu hộ"
    ) {
      router.navigate("/user/customer/home/floodRescue/floodRescueMap");
    } else if (
      latestRequestDetail?.servicepackagename === "Cứu hộ đến trạm" &&
      latestRequestDetail?.requesttype === "Cứu hộ"
    ) {
      router.navigate("/user/customer/home/emergencyRescue/emergencyRescueMap");
    } else if (
      latestRequestDetail?.servicepackagename === "Cứu hộ đến trạm" &&
      latestRequestDetail?.requesttype === "Sửa xe"
    ) {
      router.navigate("/user/customer/home/emergencyRescue/repairRequest");
    } else {
      router.navigate(
        "/user/customer/home/emergencyRescue/returnVehicleRequest"
      );
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
      <Box className="flex-1 bg-[#f1f5f9]">
      <Box className="bg-[#1a3148] pt-14 pb-20 rounded-b-[32px]">
        <Box className="px-5">
          <Box className="flex-row items-center justify-between mb-6">
            <Box className="flex-row items-center">
              <Box className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center mr-4 border border-white/20">
                <Text className="text-lg font-bold text-white">
                  {user?.username?.[0]?.toUpperCase()}
                </Text>
              </Box>
              <Box>
                <Text className="text-[#fab753] text-sm">Welcome back</Text>
                <Text className="text-white text-lg font-bold">
                  {user?.username}
                </Text>
              </Box>
            </Box>
            <Pressable className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center border border-white/20">
              <Bell color="#fab753" size={22} />
            </Pressable>
          </Box>

          <Pressable className="bg-white/10 rounded-xl flex-row items-center px-4 py-3.5 border border-white/20">
            <Search size={22} color="#fab753" className="mr-3" />
            <Text className="text-white/90 text-base font-medium">
              Find nearby rescue
            </Text>
          </Pressable>
        </Box>
      </Box>

      <ScrollView 
        className="flex-1 -mt-12 px-5" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <Box className="bg-white rounded-2xl shadow-sm border border-gray-100/50">
          <Box className="p-5 mb-6">
            <Text className="text-xl font-bold text-[#1a3148] mb-4">
              Emergency Services
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
              <ServiceCard
                icon={Car}
                title="Normal Rescue"
                color="#1a3148"
                onPress={() => router.navigate("/user/customer/home/normalRescue/normalRescueMap")}
              />
              <ServiceCard
                icon={Ambulance}
                title="Emergency"
                color="#fab753"
                onPress={() => router.navigate("/user/customer/home/emergencyRescue/emergencyRescueMap")}
              />
              <ServiceCard
                icon={Wrench}
                title="Flood Rescue"
                color="#1a3148"
                onPress={() => router.navigate("/user/customer/home/floodRescue/floodRescueMap")}
              />
            </ScrollView>
          </Box>
        </Box>

        <Box className="mt-6">
          <Text className="text-xl font-bold text-[#1a3148] mb-4">
            Quick Services
          </Text>
          <Box className="flex-row space-x-4">
            <Pressable className="flex-1 bg-white p-5 rounded-2xl border border-gray-100/50 shadow-sm">
              <Box className="w-14 h-14 bg-[#1a3148]/5 rounded-xl items-center justify-center mb-3">
                <Battery color="#1a3148" size={24} />
              </Box>
              <Box className="p-1">
                <Text className="text-[15px] font-semibold text-[#1a3148]">
                  Battery Jump
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Quick assistance
                </Text>
              </Box>
            </Pressable>

            <Pressable className="flex-1 bg-white p-5 rounded-2xl border border-gray-100/50 shadow-sm">
              <Box className="w-14 h-14 bg-[#fab753]/10 rounded-xl items-center justify-center mb-3">
                <Fuel color="#fab753" size={24} />
              </Box>
              <Box className="p-1">
                <Text className="text-[15px] font-semibold text-[#1a3148]">
                  Fuel Delivery
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Emergency fuel
                </Text>
              </Box>
            </Pressable>
          </Box>
        </Box>

        {requestId !== null && latestRequestDetail?.requeststatus !== "Done" && 
         latestRequestDetail?.requeststatus !== "Cancel" && (
          <Box className="flex-row justify-center my-6">
            <Text
              className="text-base font-medium text-[#1a3148]"
              onPress={handleNavigate}
            >
              Your recent request is not done yet. Continue?
            </Text>
          </Box>
        )}

        <Pressable
          onPress={() => router.navigate("/user/customer/home/servicePackage")}
          className="bg-[#fab753] rounded-2xl shadow-sm mb-6 mt-4"
        >
          <Box className="px-5 py-4 flex-row items-center justify-center">
            <Box className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-3">
              <Text className="text-xl font-bold text-white">SOS</Text>
            </Box>
            <Text className="text-lg font-bold text-white">
              Emergency Assistance
            </Text>
          </Box>
        </Pressable>
      </ScrollView>
    </Box>
  );
}
