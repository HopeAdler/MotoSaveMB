import { Tabs } from "expo-router";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import {
  House,
  SquareChartGantt,
  CreditCard,
  Bell,
  CircleUserRound,
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
            tabBarIcon: (tabInfo) => <House size={28} color={tabInfo.color} />,
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
              <CreditCard size={28} color={tabInfo.color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            headerShown: false,
            tabBarLabel: "Notifications",
            tabBarIcon: (tabInfo) => <Bell size={28} color={tabInfo.color} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            headerShown: false,
            tabBarLabel: "Account",
            tabBarIcon: (tabInfo) => (
              <CircleUserRound size={28} color={tabInfo.color} />
            ),
          }}
        />
      </Tabs>
    </GluestackUIProvider>
  );
}
