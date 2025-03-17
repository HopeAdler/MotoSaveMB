import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { Tabs } from "expo-router";
import { ChartArea, DollarSign, House, List } from "lucide-react-native";

export default function MechanicLayout() {
  return (
    <GluestackUIProvider mode="light">
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="home"
          options={{
            headerShown: false,
            tabBarLabel: "Trang chủ",
            tabBarIcon: (tabInfo) => <House size={24} color={tabInfo.color} />,
          }}
        />
        {/* <Tabs.Screen
          name="requests"
          options={{
            headerShown: false,
            tabBarLabel: "Yêu cầu",
            tabBarIcon: (tabInfo) => <List size={24} color={tabInfo.color} />,
          }}
        /> */}
        <Tabs.Screen
          name="transaction_history"
          options={{
            headerShown: false,
            tabBarLabel: "Lịch sử giao dịch",
            tabBarIcon: (tabInfo) => <DollarSign size={24} color={tabInfo.color} />,
          }}
        />
        <Tabs.Screen
          name="performance"
          options={{
            headerShown: false,
            tabBarLabel: "Thống kê",
            tabBarIcon: (tabInfo) => <ChartArea size={24} color={tabInfo.color} />,
          }}
        />
      </Tabs>
    </GluestackUIProvider>
  );
}
