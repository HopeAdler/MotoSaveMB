import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ScrollView, Pressable } from "react-native";
import {
  Car,
  Ambulance,
  Wrench,
  Battery,
  Fuel,
  Settings,
  Search,
  MapPin,
} from "lucide-react-native";
import { router } from "expo-router";
import LoadingScreen from "../../loading/loading";
import { LucideIcon } from "lucide-react-native";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  color: string;
}

interface LocationProps {
  name: string;
  distance: string;
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

export default function CHomeScreen() {
  const { user, dispatch } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(false);
    if (user.role !== "Customer") router.replace("/error/403");
  }, [user]);

  if (isLoading) return <LoadingScreen />;

  const handleLogout = async () => {
    dispatch?.({ type: "LOGOUT" });
    router.replace("/auth/login");
  };

  return (
    <Box className="flex-1 bg-gray-50">
      <Box className="bg-blue-600 p-4 pb-6">
        <Box className="flex flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-bold">RescueMe</Text>
          <Button variant="outline" onPress={handleLogout}>
            <Text className="text-white">Logout</Text>
          </Button>
        </Box>

        <Pressable className="w-full bg-white rounded-full flex flex-row items-center px-4 py-3">
          <Search size={20} className="text-gray-400 mr-2" />
          <Text className="text-gray-400">Where do you need help?</Text>
        </Pressable>
      </Box>

      <ScrollView className="flex-1">
        <Box className="p-4">
          <Box className="mb-6">
            <Text className="text-lg font-bold mb-4">Emergency Services</Text>
            <Box className="flex flex-row flex-wrap justify-between">
              <ServiceCard icon={Ambulance} title="Medical" color="#ef4444" />
              <ServiceCard icon={Car} title="Towing" color="#3b82f6" />
              <ServiceCard icon={Wrench} title="Repair" color="#10b981" />
            </Box>
          </Box>

          <Box className="mb-6">
            <Text className="text-lg font-bold mb-4">Quick Services</Text>
            <Box className="flex flex-row flex-wrap justify-between">
              <ServiceCard icon={Battery} title="Battery" color="#8b5cf6" />
              <ServiceCard icon={Fuel} title="Fuel" color="#f59e0b" />
              <ServiceCard icon={Settings} title="Tire" color="#6366f1" />
            </Box>
          </Box>

          <Box className="mb-6">
            <Text className="text-lg font-bold mb-4">Recent Locations</Text>
            <Box className="bg-white rounded-lg shadow-sm">
              <RecentLocation name="Home" distance="0.5 km" />
              <RecentLocation name="Office" distance="2.3 km" />
              <RecentLocation name="Workshop" distance="3.1 km" />
            </Box>
          </Box>

          <Button
            variant="solid"
            className="w-full bg-red-500 mb-4"
            onPress={() => router.navigate("/user/customer/servicePackage")}
          >
            <Text className="text-lg font-bold text-white">
              SOS - Get Help Now
            </Text>
          </Button>
        </Box>
      </ScrollView>
    </Box>
  );
}
