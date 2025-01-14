import { Stack } from "expo-router";

import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

export default function ErrorLayout() {
  return (
    <GluestackUIProvider mode="light">
      <Stack >
        <Stack.Screen name="401" options={{ headerShown: false }} />
        <Stack.Screen name="402" options={{ headerShown: false }} />
        <Stack.Screen name="403" options={{ headerShown: false }} />
        <Stack.Screen name="404" options={{ headerShown: false }} />
        <Stack.Screen name="500" options={{ headerShown: false }} />
      </Stack>
    </GluestackUIProvider>
  );
}
