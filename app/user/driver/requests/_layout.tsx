import React from "react";
import { Stack } from "expo-router";

export default function Requestlayout() {
  return (
    <Stack>
      <Stack.Screen name="request" options={{ headerShown: false }} />
      <Stack.Screen name="requestMap" options={{ headerShown: false }} />
    </Stack>
  );
}