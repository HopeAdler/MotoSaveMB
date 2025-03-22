import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { ScrollView, RefreshControl, Image } from "react-native";
import React, { useContext, useState } from "react";
import { User, Phone, Mail, Settings, Shield, HelpCircle, ChevronRight, LucideIcon } from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";
import { router } from "expo-router";
import axios from "axios";
import { useFocusEffect } from 'expo-router';

interface Profile {
  fullname: string;
  email: string | null;
  phone: string;
  gender: string | null;
  dob: string | null;
  address: string | null;
  createddate: string;
  avatar: string | null;
}

interface MenuButtonProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
  onPress?: () => void;
}

export default function DSettingscreen() {
  const { token } = useContext(AuthContext);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = React.useCallback(async () => {
    if (!token) return;
    try {
      if (!profile) setIsLoading(true);
      const response = await axios.get<Profile>(
        "https://motor-save-be.vercel.app/api/v1/auth/profile",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(response.data);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleAccountSettings = () => {
    router.push({
      pathname: "/user/driver/account/editProfile",
      params: {
        fullname: profile?.fullname || "",
        email: profile?.email || "",
        gender: profile?.gender || "",
        dob: profile?.dob || "",
        address: profile?.address || "",
        avatar: encodeURIComponent(profile?.avatar || "")
      }
    });
  };

  const menuItems: MenuButtonProps[] = [
    {
      icon: Settings,
      title: "Account Settings",
      subtitle: "Update your personal information",
      color: "#3B82F6",
      onPress: handleAccountSettings
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

  const LoadingSkeleton = () => (
    <Box className="flex-1 bg-gray-50">
      <Box className="bg-blue-600 p-6 pb-24 rounded-b-[40px] shadow-lg">
        <Box className="items-center">
          <Box className="w-28 h-28 bg-white/30 rounded-full animate-pulse" />
          <Box className="h-6 w-40 bg-white/30 rounded-full mt-4 animate-pulse" />
          <Box className="h-4 w-32 bg-white/30 rounded-full mt-2 animate-pulse" />
        </Box>
      </Box>
      
      <Box className="mx-4 -mt-16 bg-white rounded-2xl shadow-lg p-6 mb-6">
        <Box className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <Box className="space-y-4">
          <Box className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          <Box className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        </Box>
      </Box>
    </Box>
  );

  return (
    <ScrollView 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      className="flex-1 bg-gray-50"
    >
      {isLoading && !profile ? (
        <LoadingSkeleton />
      ) : (
        <>
          <Box className="bg-blue-600 px-4 pt-4 pb-16 rounded-b-[40px] shadow-lg">
            <Box className="items-center">
              <Box className="relative w-24 h-24">
                <Box className="w-24 h-24 bg-white rounded-full items-center justify-center mb-3 shadow-xl border-4 border-white overflow-hidden">
                  {profile?.avatar ? (
                    <Image
                      source={{ uri: profile.avatar }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <User size={40} color="#3B82F6" />
                  )}
                </Box>
              </Box>
              <Text className="text-white text-xl font-bold mb-1">
                {profile?.fullname || "Loading..."}
              </Text>
              <Text className="text-blue-100 text-base mb-3">
                {profile?.email || "No email provided"}
              </Text>
              <Box className="flex-row bg-white/20 rounded-full px-4 py-2">
                <Text className="text-white text-sm">Member since {new Date(profile?.createddate || "").getFullYear()}</Text>
              </Box>
            </Box>
          </Box>

          <Box className="px-4 -mt-12">
            <Box className="bg-white rounded-3xl shadow-lg p-5 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-4">Contact Information</Text>
              <Box className="space-y-3">
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

            <Box className="space-y-3">
              {menuItems.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={item.onPress}
                  className="bg-white rounded-xl p-4 flex-row items-center shadow-sm border border-gray-100"
                >
                  <Box 
                    className={`w-12 h-12 rounded-full items-center justify-center`} 
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon size={24} color={item.color} />
                  </Box>
                  <Box className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-gray-800">{item.title}</Text>
                    <Text className="text-sm text-gray-500">{item.subtitle}</Text>
                  </Box>
                  <ChevronRight size={20} color="#9CA3AF" />
                </Pressable>
              ))}
            </Box>
          </Box>
          
          <Box className="h-16" />
        </>
      )}
    </ScrollView>
  );
}