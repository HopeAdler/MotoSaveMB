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
      <Tabs>
        <Tabs.Screen
          name="home"
          options={{
            headerShown: false,
            tabBarLabel: "Home",
            tabBarIcon: (tabInfo) => <House size={24} color={tabInfo.color} />,
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            headerShown: false,
            tabBarLabel: "Activity",
            tabBarIcon: (tabInfo) => (
              <SquareChartGantt size={28} color={tabInfo.color} />
            ),
          }}
        />
        <Tabs.Screen
          name="payment"
          options={{
            headerShown: false,
            tabBarLabel: "Payment",
            tabBarIcon: (tabInfo) => (
              <CreditCard size={24} color={tabInfo.color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tracking_test"
          options={{
            headerShown: false,
            tabBarLabel: "Tracking",
            tabBarIcon: (tabInfo) => (
              <LucideLocateFixed size={24} color={tabInfo.color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            headerShown: false,
            tabBarLabel: "Notifications",
            tabBarIcon: (tabInfo) => <Bell size={24} color={tabInfo.color} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            headerShown: false,
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
          }}
        />
        <Tabs.Screen
          name="payment_success"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="rescueMap"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </GluestackUIProvider>
  );
}
