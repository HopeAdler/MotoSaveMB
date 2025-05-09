import { Image } from "react-native";
import { Text, View } from "react-native";
import { Car } from "lucide-react-native";
import { Button, ButtonText } from "../ui/button";
import UpdateGuestVehicle from "./UpdateGuestVehicle";
import { useState } from "react";

export const VehicleInfoBox = ({ repairRequestDetail }: any) => {
  const [isCreateVehicleModalOpen, setIsCreateVehicleModalOpen] =
    useState<boolean>(false);
  return (
    <View className="p-5 rounded-2xl border border-gray-100/50 shadow-sm bg-white mb-4">
      <Text className="text-[#1a3148] text-lg font-bold mb-4">
        Thông tin xe
      </Text>

      <View className="flex-row">
        {/* {repairRequestDetail?.vehiclephoto ? (
          <Image
            source={{ uri: repairRequestDetail.vehiclephoto }}
            className="w-32 h-32 rounded-xl shadow-sm"
            resizeMode="cover"
          />
        ) : (
          <View className="w-32 h-32 bg-[#1a3148]/5 rounded-xl items-center justify-center">
            <Car size={40} color="#1a3148" />
            <Text className="text-gray-500 mt-2 text-sm">Không có ảnh</Text>
          </View>
        )} */}

        <View className="ml-4 flex-1 justify-center">
          <View className="mb-3">
            <Text className="text-gray-500 text-sm mb-1">Biển số</Text>
            <Text className="text-[#1a3148] font-bold text-base">
              {repairRequestDetail?.licenseplate || "N/A"}
            </Text>
            <Text className="text-gray-500 text-sm mb-1">Hãng xe</Text>
            <Text className="text-[#1a3148] font-bold text-base">
              {repairRequestDetail?.brandname || "N/A"}
            </Text>
            {!repairRequestDetail?.licenseplate && (
              <Text
                className="text-blue-500 text-sm mb-1"
                onPress={() => setIsCreateVehicleModalOpen(true)}
              >
                Cập nhật xe
              </Text>
            )}
            <UpdateGuestVehicle
              isOpen={isCreateVehicleModalOpen}
              onClose={() => setIsCreateVehicleModalOpen(false)}
              requestId={repairRequestDetail?.requestid}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
