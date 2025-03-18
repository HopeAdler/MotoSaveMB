import React from "react";
import { Stack } from "expo-router";

export default function Activitylayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="requestDetails" options={{ headerShown: false }} />
    </Stack>
  );
}
