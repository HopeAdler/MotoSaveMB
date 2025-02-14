import { Tabs } from "expo-router";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { House } from "lucide-react-native";

export default function DriverLayout() {
  return (
    <GluestackUIProvider mode="light">
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index" // If your file is index.tsx
          options={{
            tabBarLabel: "Home",
            tabBarIcon: (tabInfo) => <House size={24} color={tabInfo.color} />,
          }}
        />
      </Tabs>
    </GluestackUIProvider>
  );
}
