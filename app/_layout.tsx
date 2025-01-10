// import { Stack } from "expo-router";

// import "@/global.css";
// import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

// export default function RootLayout() {
//   return (
//     <GluestackUIProvider mode="light">
//       <Stack />
//     </GluestackUIProvider>
//   );
// }
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Stack } from "expo-router";

export default function RootLayout() {

  return (
    <GluestackUIProvider mode="light">
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboard/index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="user/customer" options={{ headerShown: false }} />
        <Stack.Screen name="user/driver" options={{ headerShown: false }} />
        <Stack.Screen name="user/mechanic" options={{ headerShown: false }} />
      </Stack>
    </GluestackUIProvider>
  );
}
