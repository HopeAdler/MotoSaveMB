import React from "react";
import { Stack } from "expo-router";

export default function NormalRescuelayout() {
  return (
    <Stack>
      <Stack.Screen name="rescueMap" options={{ headerShown: false }} />
    </Stack>
  );
}
