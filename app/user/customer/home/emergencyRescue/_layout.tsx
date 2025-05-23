import React from "react";
import { Stack } from "expo-router";

export default function EmergencyRescuelayout() {
  return (
    <Stack>
      <Stack.Screen name="emergencyRescueMap" options={{ headerShown: false }} />
      <Stack.Screen name="repairRequest" options={{ headerShown: false }} />
      <Stack.Screen name="repairCostPreview" options={{ headerShown: false }} />
      <Stack.Screen name="returnVehicleRequest" options={{ headerShown: false }} />
    </Stack>
  );
}
