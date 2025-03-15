import React from "react";
import { Stack } from "expo-router";

export default function FloodRescuelayout() {
  return (
    <Stack>
      <Stack.Screen name="floodRescueMap" options={{ headerShown: false }} />
    </Stack>
  );
}
