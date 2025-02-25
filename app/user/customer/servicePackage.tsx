import React from "react";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Image, View, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

const servicePackage = () => {
  return (
    <Box className="flex-1 p-5">
      <Box className="flex-row items-center justify-between mb-6">
        <Pressable onPress={() => router.back()}>
          <Box className="flex-row items-center">
            <ChevronLeft size={28} color="#374151" />
          </Box>
        </Pressable>

        <Text bold size="2xl" className="flex-1 text-center">
          Chọn loại hình dịch vụ
        </Text>

        <Box style={{ width: 28 }} />
      </Box>

      <View className="mt-2 p-10 flex-row justify-center items-center">
        <Card className="w-400 bg-gray-300 rounded-lg items-center p-4 mr-7">
          <Image
            source={require("../../../assets/images/emergency.png")}
            className="w-12 h-12 mb-4"
            resizeMode="contain"
          />
          <Text
            className="text-gray-700 font-semibold"
            onPress={() => router.navigate("/user/customer/rescueMap")}
          >
            Cứu hộ khẩn cấp
          </Text>
        </Card>

        <Card className="w-400 bg-gray-300 rounded-lg items-center p-4">
          <Image
            source={require("../../../assets/images/emergency.png")}
            className="w-12 h-12 mb-4"
            resizeMode="contain"
          />
          <Text className="text-gray-700 font-semibold">Cứu hộ thường</Text>
        </Card>
      </View>
    </Box>
  );
};

export default servicePackage;
