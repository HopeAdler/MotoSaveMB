// src/app/components/MyLocationButton.tsx
import React from "react";
import { StyleSheet } from "react-native";
import { Button, ButtonIcon } from "@/components/ui/button";
import { LocateFixed } from "lucide-react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface MyLocationButtonProps {
  onPress: () => void;
  isActionSheetOpen: boolean;
}

const MyLocationButton: React.FC<MyLocationButtonProps> = ({ onPress, isActionSheetOpen }) => {
  const offset = useSharedValue(10);

  React.useEffect(() => {
    offset.value = withTiming(isActionSheetOpen ? 200 : 10, { duration: 300 });
  }, [isActionSheetOpen]);

  const animatedStyle = useAnimatedStyle(() => ({ bottom: offset.value }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Button variant="solid" size="lg" className="rounded-full p-3.5" onPress={onPress}>
        <ButtonIcon as={LocateFixed} />
      </Button>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 5,
    zIndex: 20,
  },
});

export default MyLocationButton;
