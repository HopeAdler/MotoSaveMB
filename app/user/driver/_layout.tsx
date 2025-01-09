import { Stack } from "expo-router";

import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

export default function DriverLayout() {
  return (
    <GluestackUIProvider mode="light">
      <Stack >
        <Stack.Screen name="home" options={{ headerShown: false }} />
      </Stack>
    </GluestackUIProvider>
  );
}
