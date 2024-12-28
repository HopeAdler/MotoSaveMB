import { Box } from "@/components/ui/box";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View>
      <Box className="bg-primary-500 p-10">
        <Text className="text-typography-0 text-center font-extrabold text-2xl">
          MotoSave
        </Text>
      </Box>
    </View>
  );
}
