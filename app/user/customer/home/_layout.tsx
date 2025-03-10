import React from "react";
import { Stack } from "expo-router";

export default function Homelayout() {
  return (
    <Stack>
      <Stack.Screen name="homepage" options={{ headerShown: false }} />
      <Stack.Screen name="servicePackage" options={{ headerShown: false }} />
      <Stack.Screen name="feedback" options={{ headerShown: false }} />
      <Stack.Screen name="normalRescue" options={{ headerShown: false }} />
    </Stack>
  );
}
