import React from "react";
import { Stack } from "expo-router";

export default function NormalRescuelayout() {
  return (
    <Stack>
      <Stack.Screen name="emergencyRescueMap" options={{ headerShown: false }} />
      {/* <Stack.Screen name="chatScreen" options={{ headerShown: false }} /> */}
    </Stack>
  );
}
