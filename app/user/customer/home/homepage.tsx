import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { ScrollView, Pressable } from "react-native";
import {
  Car, Ambulance, Wrench, Battery, Fuel, 
  Search, Bell
} from "lucide-react-native";
import { router } from "expo-router";
import LoadingScreen from "../../../loading/loading";

interface ServiceCardProps {
  icon: React.ElementType;
  title: string;
  color: string;
  onPress: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon: Icon, title, color, onPress }) => (
  <Pressable 
    onPress={onPress}
    className="mr-3"
  >
    <Box className="w-[150px] bg-white/90 backdrop-blur-sm rounded-3xl p-4 border border-gray-100/30 shadow-sm">
      <Box 
        className="w-12 h-12 rounded-2xl items-center justify-center mb-3" 
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon color={color} size={22} />
      </Box>
      <Text className="text-[15px] font-semibold text-gray-800">{title}</Text>
      <Text className="text-xs text-gray-500">Available 24/7</Text>
    </Box>
  </Pressable>
);

export default function CHomeScreen() {
  const { user, dispatch } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
  }, []);



  if (!user) {
    router.replace("/auth/login");
    return null;
  }

  if (user.role !== "Customer") {
    router.replace("/error/403");
    return null;
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <Box className="flex-1 bg-gray-50">
      <Box className="bg-blue-600 pt-14 pb-24 rounded-b-[32px]">
        <Box className="px-5">
          <Box className="flex-row items-center justify-between mb-6">
            <Box className="flex-row items-center">
              <Box className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-2xl items-center justify-center mr-4 border border-white/10">
                <Text className="text-xl font-bold text-white">
                  {user?.username?.[0]?.toUpperCase()}
                </Text>
              </Box>
              <Box>
                <Text className="text-blue-100/80 text-sm">Welcome back</Text>
                <Text className="text-white text-lg font-bold">{user?.username}</Text>
              </Box>
            </Box>
            <Pressable className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-2xl items-center justify-center border border-white/10">
              <Bell color="white" size={22} />
            </Pressable>
          </Box>

          <Box className="mt-4">
            <Pressable className="bg-white/10 backdrop-blur-lg rounded-2xl flex-row items-center px-5 py-4 border border-white/10">
              <Search size={22} color="#fff" className="opacity-70 mr-3" />
              <Text className="text-white/90 text-base font-medium">Find nearby rescue</Text>
            </Pressable>
          </Box>
        </Box>
      </Box>

      <ScrollView className="flex-1 -mt-16 px-5" showsVerticalScrollIndicator={false}>
        <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Emergency Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
            <ServiceCard 
              icon={Car}
              title="Normal Rescue"
              color="#2563eb"
              onPress={() => router.navigate("/user/customer/home/normalRescue/normalRescueMap")}
            />
            <ServiceCard
              icon={Ambulance} 
              title="Emergency"
              color="#dc2626"
              onPress={() => router.navigate("/user/customer/home/emergencyRescue/emergencyRescueMap")}
            />
            <ServiceCard
              icon={Wrench}
              title="Flood Rescue"
              color="#059669"
              onPress={() => router.navigate("/user/customer/home/floodRescue/floodRescueMap")}
            />
          </ScrollView>
        </Box>

        <Box className="mb-5">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Services</Text>
          <Box className="flex-row space-x-3">
            <Pressable className="flex-1 bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-gray-100/50">
              <Box className="w-12 h-12 bg-violet-50 rounded-2xl items-center justify-center mb-3">
                <Battery color="#7c3aed" size={22} />
              </Box>
              <Text className="text-base font-semibold text-gray-800">Battery Jump</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Quick assistance</Text>
            </Pressable>

            <Pressable className="flex-1 bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-gray-100/50">
              <Box className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center mb-3">
                <Fuel color="#d97706" size={22} />
              </Box>
              <Text className="text-base font-semibold text-gray-800">Fuel Delivery</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Emergency fuel</Text>
            </Pressable>
          </Box>
        </Box>

        <Pressable
          onPress={() => router.navigate("/user/customer/home/servicePackage")}
          className="bg-red-500 rounded-2xl shadow-sm mb-6 overflow-hidden"
        >
          <Box className="px-5 py-4 flex-row items-center justify-center">
            <Box className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center mr-3">
              <Text className="text-xl font-bold text-white">SOS</Text>
            </Box>
            <Text className="text-lg font-semibold text-white">Emergency Assistance</Text>
          </Box>
        </Pressable>
      </ScrollView>
    </Box>
  );
}