import { Image } from "react-native";
import { Text, View } from "react-native";

export const VehicleInfoBox = ({ repairRequestDetail }: any) => {
  return (
    <View className="p-4 rounded-xl border border-gray-300 shadow-md bg-white flex-row items-center">
      {repairRequestDetail?.vehiclephoto ? (
        <Image
          source={{ uri: repairRequestDetail.vehiclephoto }}
          className="w-32 h-32 rounded-lg shadow-md"
          resizeMode="cover"
        />
      ) : (
        <View className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
          <Text className="text-gray-500 italic">Chưa có ảnh</Text>
        </View>
      )}

      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-900 mb-2">Thông tin xe:</Text>
        <Text className="text-base mb-1">
          Biển số:
          <Text className="font-medium text-green-700"> {repairRequestDetail?.licenseplate}</Text>
        </Text>
        <Text className="text-base mb-1">
          Tình trạng: {repairRequestDetail?.vehiclecondition || "Đang sửa chữa"}
        </Text>
      </View>
    </View>
  );
};