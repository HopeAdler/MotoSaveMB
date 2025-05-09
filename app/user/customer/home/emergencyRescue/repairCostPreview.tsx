import { formatMoney } from "@/app/utils/utils";
import { GoBackButton } from "@/components/custom/GoBackButton";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import axios from "axios";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { FlatList } from "react-native-gesture-handler";

interface RepairCostItem {
  id: number;
  name: string;
  description: string;
  min: number;
  max: number;
  managedby: string;
}
const RepairCostPreviewScreen = () => {
  const [costPreviews, setCostPreviews] = useState<RepairCostItem[]>([]);
  const fetchRepairCostPreview = async () => {
    try {
      const response = await axios.get(
        "https://motor-save-be.vercel.app/api/v1/repaircostpreviews"
      );
      setCostPreviews(response.data);
    } catch (error) {
      console.error("Error fetching request details:", error);
    }
  };
  useEffect(() => {
    fetchRepairCostPreview();
  }, []);
  const renderItem = ({ item }: { item: RepairCostItem }) => (
    <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
      <Box className="flex-row items-center justify-between">
        <Text className="text-base font-medium text-gray-900">Tên hạng mục:</Text>
        <Text className="text-sm text-gray-900">{item?.name}</Text>
      </Box>

      <Box className="flex-row items-center justify-between">
        <Text className="text-base font-medium text-gray-900">Mô tả:</Text>
        <Text className="text-sm text-gray-900">{item?.description}</Text>
      </Box>
      <Box className="flex-row items-center justify-between">
        <Text className="text-base font-medium text-gray-900">Chi phí sửa chữa:</Text>
        <Text className="text-base font-semibold text-gray-900">
          {/* {item?.min.toLocaleString()}VNĐ - {item?.max.toLocaleString()}VNĐ */}
          {formatMoney(item?.min)} - {formatMoney(item?.max)}
        </Text>
      </Box>
    </Box>
  );
  return (
    <Box className="flex-1 bg-gray-100 p-4">
      <Box className="flex-row items-center mb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text bold size="xl" className="flex-1 text-center mr-10">
            Bảng giá dịch vụ sửa xe
          </Text>
        </Box>
      <FlatList
        data={costPreviews}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => renderItem({ item })}
      />
    </Box>
  );
};

export default RepairCostPreviewScreen;
