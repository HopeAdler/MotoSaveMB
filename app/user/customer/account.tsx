import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ScrollView, RefreshControl } from "react-native";
import React, { useContext, useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  LucideIcon,
  Camera
} from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";
import { Divider } from "@/components/ui/divider";
import { router } from "expo-router";
import axios from "axios";

interface Profile {
  username: string;
  email: string | null;
  fullname: string;
  gender: string | null;
  dob: string | null;
  phone: string;
  address: string | null;
  licenseplate: string | null;
  createddate: string;
  updateddate: string;
  statusid: number;
}
interface MenuButtonProps {
  icon: LucideIcon;
  title: string;
  onPress: () => void;
}

export default function CSettingscreen() {
  const { user, token, dispatch } = useContext(AuthContext);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = React.useCallback(async () => {
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get<Profile>(
        "https://motor-save-be.vercel.app/api/v1/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProfile(response.data);
    } catch (error) {
      setError('Failed to load profile');
      console.error("Error fetching profile:", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        dispatch?.({ type: "LOGOUT" });
        router.replace("/auth/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, dispatch]);

  const handleLogout = React.useCallback(() => {
    dispatch?.({ type: "LOGOUT" });
    router.replace("/auth/login");
  }, [dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const menuItems = [
    {
      icon: Settings,
      title: "Account Settings",
      subtitle: "Update your personal information",
      color: "#3B82F6"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      subtitle: "Manage your security preferences",
      color: "#10B981"
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      subtitle: "Get help with your account",
      color: "#8B5CF6"
    }
  ];

  return (
    <ScrollView 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      className="flex-1 bg-gray-50"
    >
      <Box className="bg-blue-600 p-6 pb-24 rounded-b-[40px] shadow-lg">
        <Box className="items-center">
          <Pressable 
            className="relative w-28 h-28" 
            onPress={() => {}}
          >
            <Box className="w-28 h-28 bg-white rounded-full items-center justify-center mb-4 shadow-xl border-4 border-white">
              <User size={48} color="#3B82F6" />
            </Box>
            <Box className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full">
              <Camera size={16} color="white" />
            </Box>
          </Pressable>
          <Text className="text-white text-2xl font-bold mb-2">
            {profile?.fullname || "Loading..."}
          </Text>
          <Text className="text-blue-100 text-base">
            {profile?.email || "No email provided"}
          </Text>
          <Box className="flex-row mt-4 bg-white/20 rounded-full px-4 py-2">
            <Text className="text-white text-sm">Member since {new Date(profile?.createddate || "").getFullYear()}</Text>
          </Box>
        </Box>
      </Box>

      <Box className="mx-4 -mt-16 bg-white rounded-2xl shadow-lg p-6 mb-6">
        <Text className="text-lg font-bold text-gray-800 mb-4">Contact Information</Text>
        <Box className="space-y-4">
          <Box className="flex-row items-center p-3 bg-gray-50 rounded-xl">
            <Box className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
              <Phone size={20} color="#3B82F6" />
            </Box>
            <Box className="ml-3">
              <Text className="text-sm text-gray-500">Phone Number</Text>
              <Text className="text-base font-medium text-gray-700">
                {profile?.phone || "Not provided"}
              </Text>
            </Box>
          </Box>
          
          <Box className="flex-row items-center p-3 bg-gray-50 rounded-xl">
            <Box className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
              <Mail size={20} color="#10B981" />
            </Box>
            <Box className="ml-3">
              <Text className="text-sm text-gray-500">Email Address</Text>
              <Text className="text-base font-medium text-gray-700">
                {profile?.email || "Not provided"}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="px-4 space-y-3">
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => {}}
            className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm border border-gray-100"
          >
            <Box className={`w-12 h-12 rounded-full items-center justify-center`} 
                 style={{ backgroundColor: `${item.color}15` }}>
              <item.icon size={24} color={item.color} />
            </Box>
            <Box className="flex-1 ml-4">
              <Text className="text-base font-semibold text-gray-800">{item.title}</Text>
              <Text className="text-sm text-gray-500">{item.subtitle}</Text>
            </Box>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>
        ))}

        <Divider className="my-6" />

        <Button
          variant="outline"
          className="bg-white border-red-100 rounded-2xl shadow-sm"
          onPress={handleLogout}
        >
          <Box className="flex-row items-center py-2">
            {/* <Box className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
              <LogOut size={20} color="#EF4444" />
            </Box> */}
            <Text className="ml-3 text-red-500 font-semibold text-base">Log Out</Text>
          </Box>
        </Button>
      </Box>
      
      <Box className="h-16" />
    </ScrollView>
  );
}