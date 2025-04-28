import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { Tabs } from "expo-router";
import {
  ChartArea,
  DollarSign,
  House,
  List,
  CircleUserRound,
} from "lucide-react-native";
import { useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";

export default function MechanicLayout() {
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      axios
        .get("https://motor-save-be.vercel.app/api/v1/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch((err) => {
          console.log("Prefetch error:", err);
        });
    }
  }, [token]);

  return (
    <GluestackUIProvider mode="light">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.1)",
            height: 64,
            paddingTop: 8,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: "#fab753",
          tabBarInactiveTintColor: "#1a3148",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginTop: 1,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            headerShown: false,
            tabBarLabel: "Trang chủ",
            tabBarIcon: (tabInfo) => (
              <Box
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: tabInfo.focused
                    ? "rgba(250, 183, 83, 0.1)"
                    : "transparent",
                }}
              >
                <House
                  size={22}
                  color={tabInfo.focused ? "#fab753" : "#1a3148"}
                  strokeWidth={tabInfo.focused ? 2.5 : 2}
                />
              </Box>
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            headerShown: false,
            tabBarLabel: "Yêu cầu",
            tabBarIcon: (tabInfo) => (
              <Box
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: tabInfo.focused
                    ? "rgba(250, 183, 83, 0.1)"
                    : "transparent",
                }}
              >
                <List
                  size={22}
                  color={tabInfo.focused ? "#fab753" : "#1a3148"}
                  strokeWidth={tabInfo.focused ? 2.5 : 2}
                />
              </Box>
            ),
          }}
        />
        <Tabs.Screen
          name="transaction_history"
          options={{
            href: null,
            headerShown: false,
            tabBarLabel: "Lịch sử giao dịch",
            tabBarIcon: (tabInfo) => (
              <DollarSign size={24} color={tabInfo.color} />
            ),
          }}
        />
        <Tabs.Screen
          name="performance"
          options={{
            href: null,
            headerShown: false,
            tabBarLabel: "Thống kê",
            tabBarIcon: (tabInfo) => (
              <ChartArea size={24} color={tabInfo.color} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            tabBarLabel: "Tài khoản",
            tabBarIcon: (tabInfo) => (
              <Box
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: tabInfo.focused
                    ? "rgba(250, 183, 83, 0.1)"
                    : "transparent",
                }}
              >
                <CircleUserRound
                  size={22}
                  color={tabInfo.focused ? "#fab753" : "#1a3148"}
                  strokeWidth={tabInfo.focused ? 2.5 : 2}
                />
              </Box>
            ),
          }}
        />
      </Tabs>
    </GluestackUIProvider>
  );
}
