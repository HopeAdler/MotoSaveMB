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
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            position: 'absolute',
            bottom: 16,
            right: 16,
            left: 16,
            height: 64,
            borderRadius: 25,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
            borderTopWidth: 0,
            paddingBottom: 8,
            paddingTop: 8,
            marginHorizontal: 16,
          },
          tabBarActiveTintColor: '#fab753',
          tabBarInactiveTintColor: '#1a3148',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '300',
            marginTop: 1,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarLabel: "Home",
            tabBarIcon: (tabInfo) => (
              <Box
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: tabInfo.focused ? 'rgba(250, 183, 83, 0.1)' : 'transparent',
                }}
              >
                <House
                  size={20}
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
            tabBarLabel: "Activity",
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
            tabBarLabel: "Account",
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
