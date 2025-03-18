import { GoBackButton } from "@/components/custom/GoBackButton";
import { Box } from "@/components/ui/box";
import React from "react";
import { Text } from "react-native";

export default function Requestlayout() {
  return (
    <Box className="flex-1 p-5">
      <GoBackButton />
      <Text>
        This is repair request Detail
      </Text>
    </Box>
  );
}