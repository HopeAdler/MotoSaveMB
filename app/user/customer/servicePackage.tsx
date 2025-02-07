import React from 'react'
import { Box } from "@/components/ui/box";
import { Card } from '@/components/ui/card'
import { Text } from "@/components/ui/text";
import { Image, View } from 'react-native';
import { router } from "expo-router";

const servicePackage = () => {
  return (
    <Box className="flex-1 p-5">
      <Text bold size="2xl" className='text-center'>
        Chọn loại hình dịch vụ
      </Text>
      <View className="mt-6 p-10 flex-row justify-center items-center">
        <Card className="w-400 bg-gray-300 rounded-lg items-center p-4 mr-7">
          <Image
            source={require("../../../assets/images/emergency.png")}
            className="w-12 h-12 mb-4"
            resizeMode="contain"
          />
          <Text className="text-gray-700 font-semibold" onPress={() => router.navigate('/user/customer/rescueMap')}>Cứu hộ khẩn cấp</Text>
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
  )
}

export default servicePackage