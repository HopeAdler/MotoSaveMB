import { Tabs } from "expo-router";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import {
  House,
  SquareChartGantt,
  CreditCard,
  Bell,
  CircleUserRound,
  LucideLocateFixed,
} from "lucide-react-native";

export default function CustomerLayout() {
  return (
    <GluestackUIProvider mode="light">
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="home"
          options={{
            tabBarLabel: "Home",
            tabBarIcon: (tabInfo) => <House size={24} color={tabInfo.color} />,
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            tabBarLabel: "Activity",
            tabBarIcon: (tabInfo) => (
              <SquareChartGantt size={28} color={tabInfo.color} />
            ),
          }}
        />
        <Tabs.Screen
          name="payment"
          options={{
            tabBarLabel: "Payment",
            tabBarIcon: (tabInfo) => (
              <CreditCard size={24} color={tabInfo.color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            tabBarLabel: "Notifications",
            tabBarIcon: (tabInfo) => <Bell size={24} color={tabInfo.color} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            tabBarLabel: "Account",
            tabBarIcon: (tabInfo) => (
              <CircleUserRound size={24} color={tabInfo.color} />
            ),
          }}
        />
        <Tabs.Screen
          name="servicePackage"
          options={{
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="payment_success"
          options={{
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="rescueMap"
          options={{
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="feedback"
          options={{
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />
      </Tabs>
    </GluestackUIProvider>
  );
}
