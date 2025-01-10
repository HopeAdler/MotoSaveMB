import { Stack } from "expo-router";

import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

export default function AuthLayout() {
  return (
    <GluestackUIProvider mode="light">
      <Stack >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-pass" options={{ headerShown: false }} />
        <Stack.Screen name="otp" options={{ headerShown: false }} />
      </Stack>
    </GluestackUIProvider>
  );
}
