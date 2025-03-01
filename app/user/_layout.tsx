import React from "react";
import { Stack } from "expo-router";

export default function Userlayout() {
  return (
    <Stack>
      <Stack.Screen name="customer" options={{ headerShown: false }} />
      <Stack.Screen name="driver" options={{ headerShown: false }} />
      <Stack.Screen name="mechanic" options={{ headerShown: false }} />
    </Stack>
  );
}
