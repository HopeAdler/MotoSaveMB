import React from "react";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Image, View } from "react-native";
import { Pressable } from "@/components/ui/pressable";
import { router } from "expo-router";
import { ChevronLeft, Zap, Clock } from "lucide-react-native";

const ServicePackage = () => {
  return (
    <Box className="flex-1 bg-gray-50">
      <Box className="bg-white p-5 shadow-sm">
        <Box className="flex-row items-center">
          <Pressable
            onPress={() => router.navigate("/user/customer/home/homepage")}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text bold size="xl" className="flex-1 text-center mr-10">
            Chọn dịch vụ cứu hộ
          </Text>
        </Box>
      </Box>

      <Box className="p-6">
        <Text className="text-gray-600 text-base mb-6 text-center">
          Chọn loại hình dịch vụ phù hợp với nhu cầu của bạn
        </Text>

        <View className="space-y-4">
          <Pressable onPress={() => router.navigate("/user/customer/home/emergencyRescue/emergencyRescueMap")}>
            <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-2">
              <Box className="flex-row items-center">
                <Box className="bg-red-50 p-4 rounded-xl">
                  <Zap size={28} color="#EF4444" />
                </Box>
                <Box className="ml-4 flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">
                    Cứu hộ khẩn cấp
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Ưu tiên xử lý nhanh • Hỗ trợ 24/7
                  </Text>
                </Box>
              </Box>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => router.navigate("/user/customer/home/normalRescue/rescueMap")}
          >
            <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <Box className="flex-row items-center">
                <Box className="bg-blue-50 p-4 rounded-xl">
                  <Clock size={28} color="#3B82F6" />
                </Box>
                <Box className="ml-4 flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">
                    Cứu hộ thường
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Giá ưu đãi • Thời gian linh hoạt
                  </Text>
                </Box>
              </Box>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => router.navigate("/user/customer/home/floodRescue/floodRescueMap")}
          >
            <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <Box className="flex-row items-center">
                <Box className="bg-blue-50 p-4 rounded-xl">
                  <Clock size={28} color="#3B82F6" />
                </Box>
                <Box className="ml-4 flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">
                    Cứu hộ qua chỗ lũ
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Giá ưu đãi • Thời gian linh hoạt
                  </Text>
                </Box>
              </Box>
            </Card>
          </Pressable>
        </View>

        <Box className="mt-8">
          <Text className="text-xs text-gray-500 text-center">
            Chọn cứu hộ khẩn cấp để được ưu tiên xử lý ngay lập tức
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default ServicePackage;
