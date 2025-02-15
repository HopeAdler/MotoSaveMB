import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import {
  ArchiveRestore,
  GalleryThumbnails,
  LucideIcon,
  MapPin,
  Route,
  Siren,
  Truck
} from "lucide-react-native";
import React, { useContext, useEffect, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import LoadingScreen from "../../loading/loading";
import { Avatar } from "react-native-elements";

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

export default function DHomeScreen() {
  const { user, dispatch } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(false);
    if (user.role !== "Driver") router.replace("/error/403");
  }, [user]);

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

      <ScrollView className="flex-1">
        <Box className="p-4">
          <Box className="mb-6">
            <Text className="text-lg font-bold mb-4">Hàng chờ yêu cầu</Text>
            <Box className="flex flex-row flex-wrap">
              <ServiceCard icon={Siren} title="Cứu hộ xe" color="#ef4444" />
              <ServiceCard icon={Route} title="Vận chuyển" color="#3b82f6" />
              <ServiceCard icon={ArchiveRestore} title="Trả xe" color="#10b981" />
            </Box>
          </Box>

          <Box className="mb-6">
            <Text className="text-lg font-bold mb-4">Nghiệp vụ liên quan</Text>
            <Box className="flex flex-row flex-wrap">
              <ServiceCard icon={Truck} title="Xe cứu hộ" color="#8b5cf6" />
              <ServiceCard icon={GalleryThumbnails} title="Xe gửi tại trạm" color="#ff0000" />
            </Box>
          </Box>

          <Box className="mb-6">
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
      </ScrollView>
    </Box >
  );
}
