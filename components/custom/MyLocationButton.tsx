// src/app/components/MyLocationButton.tsx
import React from "react";
import { StyleSheet } from "react-native";
import { Button, ButtonIcon } from "@/components/ui/button";
import { LocateFixed } from "lucide-react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Box } from "../ui/box";

interface MyLocationButtonProps {
  onPress: () => void;
}

const MyLocationButton: React.FC<MyLocationButtonProps> = ({ onPress}) => {
  const offset = useSharedValue(10);

  // React.useEffect(() => {
  //   offset.value = withTiming(isActionSheetOpen ? 500 : 10, { duration: 300 });
  // }, [isActionSheetOpen]);

  // const animatedStyle = useAnimatedStyle(() => ({ bottom: offset.value }));

  return (
    <Box className="absolute bottom-1 pt-22 right-4 w-12 h-12 z-20">
      <Button variant="solid"  size="lg" className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-md" onPress={onPress}>
        <ButtonIcon as={LocateFixed} color="#374151" />
      </Button>
    </Box>
  );
};


export default MyLocationButton;
