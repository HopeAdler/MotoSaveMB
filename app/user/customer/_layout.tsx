import { Tabs } from "expo-router";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Box } from "@/components/ui/box";
import {
  House,
  SquareChartGantt,
  Bell,
  CircleUserRound,
} from "lucide-react-native";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import axios from "axios";

export default function CustomerLayout() {
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
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: 'rgba(0,0,0,0.1)',
            height: 64,
            paddingTop: 8,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#fab753',
          tabBarInactiveTintColor: '#1a3148',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 1,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarLabel: "Trang chủ",
            tabBarIcon: (tabInfo) => (
              <Box
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: tabInfo.focused ? 'rgba(250, 183, 83, 0.1)' : 'transparent',
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
          name="activity"
          options={{
            tabBarLabel: "Hoạt động",
            tabBarIcon: (tabInfo) => (
              <Box
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: tabInfo.focused ? 'rgba(250, 183, 83, 0.1)' : 'transparent',
                }}
              >
                <SquareChartGantt
                  size={22}
                  color={tabInfo.focused ? "#fab753" : "#1a3148"}
                  strokeWidth={tabInfo.focused ? 2.5 : 2}
                />
              </Box>
            ),
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            href: null,
            tabBarStyle: { display: "none" },
            tabBarLabel: "Notifications",
            tabBarIcon: (tabInfo) => (
              <Box
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: tabInfo.focused ? 'rgba(250, 183, 83, 0.1)' : 'transparent',
                }}
              >
                <Bell
                  size={22}
                  color={tabInfo.focused ? "#fab753" : "#1a3148"}
                  strokeWidth={tabInfo.focused ? 2.5 : 2}
                />
              </Box>
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
                  backgroundColor: tabInfo.focused ? 'rgba(250, 183, 83, 0.1)' : 'transparent',
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
        <Tabs.Screen
          name="payment"
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
      </Tabs>
    </GluestackUIProvider>
  );
}
