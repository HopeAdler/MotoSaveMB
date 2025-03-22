import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { Tabs } from "expo-router";
import { ChartArea, DollarSign, House, List, CircleUserRound } from "lucide-react-native";
import { useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "@/app/context/AuthContext";


export default function MechanicLayout() {
  const { token } = useContext(AuthContext); 
  
    useEffect(() => {
      if (token) {
        axios.get("https://motor-save-be.vercel.app/api/v1/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(err => {
          console.log('Prefetch error:', err);
        });
      }
    }, [token]);
    
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
        <Tabs.Screen
          name="requests"
          options={{
            headerShown: false,
            tabBarLabel: "Yêu cầu",
            tabBarIcon: (tabInfo) => <List size={24} color={tabInfo.color} />,
          }}
        />
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
        <Tabs.Screen
          name="account"
          options={{
            tabBarLabel: "Account",
            tabBarIcon: (tabInfo) => (
              <CircleUserRound size={24} color={tabInfo.color} />
            ),
          }}
        />
      </Tabs>
    </GluestackUIProvider>
  );
}
