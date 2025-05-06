import AuthContext from "@/app/context/AuthContext";
import { useCurrentLocStore } from "@/app/hooks/currentLocStore";
import { usePendingReqStore } from "@/app/hooks/usePendingReqStore";
import { useUsersStore } from "@/app/hooks/usersStore";
import {
  getCurrentLocation,
  requestLocationPermission,
  watchLocation,
} from "@/app/services/locationService";
import { usePubNubService } from "@/app/services/pubnubService"; // ✅ Use the custom hook
import { decodedToken } from "@/app/utils/utils";
import { Box } from "@/components/ui/box";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import axios from "axios";
import { getHeadingAsync } from "expo-location";
import { Tabs, useRouter, useSegments } from "expo-router";
import {
  ChartArea,
  CircleUserRound,
  DollarSign,
  House,
  List,
  MapIcon
} from "lucide-react-native";
import { useContext, useEffect, useRef } from "react";

const SMOOTHING_FACTOR = 0.1;

export default function DriverLayout() {
  const router = useRouter();
  const segment = useSegments<any>();
  const {
    publishLocation,
    subscribeToChannel,
    subscribeToRescueChannel,
    hereNow,
  } = usePubNubService(); // ✅ Get service functions

  const {
    pendingReqDetailIds,
    setPendingReqDetailIds,
  } = usePendingReqStore();
  const {
    currentLoc,
    setCurrentLoc,
  } = useCurrentLocStore();
  const {
    getUsers,
    setUsers,
  } = useUsersStore();

  const { user, token } = useContext(AuthContext);

  const lastLocation = useRef({ latitude: 0, longitude: 0, heading: 0 });

  const userId = decodedToken(token)?.id;

  const updateLocation = async (locationSubscription: any) => {
    if ((await requestLocationPermission()) && userId) {
      const location = await getCurrentLocation();
      const { latitude, longitude } = location.coords;
      const bearing = await getHeadingAsync();

      const newLocation = {
        latitude,
        longitude,
        heading: bearing.trueHeading, // Ensure heading is always a number
      };

      // Ensure `currentLoc` has valid values before smoothing
      if (currentLoc?.latitude && currentLoc?.longitude) {
        var smoothedLatitude =
          currentLoc.latitude +
          SMOOTHING_FACTOR * (newLocation.latitude - currentLoc.latitude);
        var smoothedLongitude =
          currentLoc.longitude +
          SMOOTHING_FACTOR * (newLocation.longitude - currentLoc.longitude);
      } else {
        // If currentLoc is null, use raw values
        smoothedLatitude = latitude;
        smoothedLongitude = longitude;
      }

      // ✅ Use smoothed values when publishing
      publishLocation(
        userId,
        user,
        smoothedLatitude,
        smoothedLongitude,
        newLocation.heading
      );

      // ✅ Use smoothed values when updating state
      const smoothedLocation = {
        latitude: smoothedLatitude,
        longitude: smoothedLongitude,
        heading: newLocation.heading,
      };

      if (
        smoothedLocation.latitude !== lastLocation.current.latitude ||
        smoothedLocation.longitude !== lastLocation.current.longitude ||
        smoothedLocation.heading !== lastLocation.current.heading
      ) {
        lastLocation.current = smoothedLocation;
        setCurrentLoc(smoothedLocation); // ✅ Update state with smoothed values
      }

      // Watch for location changes
      locationSubscription = await watchLocation(async (position: any) => {
        const { latitude, longitude } = position.coords;
        const updatedBearing = await getHeadingAsync(); // Fetch new heading

        const updatedLocation = {
          latitude,
          longitude,
          heading: updatedBearing.trueHeading, // Ensure heading is never null
        };

        // Smooth location updates
        const smoothedLatitude =
          lastLocation.current.latitude +
          SMOOTHING_FACTOR *
          (updatedLocation.latitude - lastLocation.current.latitude);
        const smoothedLongitude =
          lastLocation.current.longitude +
          SMOOTHING_FACTOR *
          (updatedLocation.longitude - lastLocation.current.longitude);

        const smoothedUpdatedLocation = {
          latitude: smoothedLatitude,
          longitude: smoothedLongitude,
          heading: updatedLocation.heading,
        };

        if (
          smoothedUpdatedLocation.latitude !== lastLocation.current.latitude ||
          smoothedUpdatedLocation.longitude !==
          lastLocation.current.longitude ||
          smoothedUpdatedLocation.heading !== lastLocation.current.heading
        ) {
          lastLocation.current = smoothedUpdatedLocation;
          setCurrentLoc(smoothedUpdatedLocation); // ✅ Use smoothed values here
        }
      });
    }
  };

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

  useEffect(() => {
    let locationSubscription: any;

    updateLocation(locationSubscription);
    const intervalId = setInterval(updateLocation, 5000);

    return () => {
      clearInterval(intervalId);
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  useEffect(() => {
    // Render Users

    subscribeToChannel(
      user,
      (msg: any) => {
        if (msg.publisher === userId) {
          const currentUsers = getUsers();
          const updatedUsers = new Map(currentUsers);
          updatedUsers.set(msg.publisher, msg.message);
          setUsers(updatedUsers);
        }
      },
      (event: any) => {
        if (event.action === 'leave' || event.action === 'timeout') {
          const currentUsers = getUsers();
          const updatedUsers = new Map(currentUsers);
          updatedUsers.delete(event.uuid);
          setUsers(updatedUsers);
        }
      }
    );


    // Listen to requests from PubNub
    subscribeToRescueChannel((msg: any) => {
      if (
        msg.message.senderRole === "Customer" &&
        msg.message.driverId === userId
      ) {
        const updatedMap = pendingReqDetailIds;
        console.log(updatedMap)
        updatedMap.set(msg.publisher, msg.message.requestDetailId);
        setPendingReqDetailIds(updatedMap);
      }
    });

    return () => {
      // pubnub?.unsubscribeAll();
      // pubnub?.destroy(); // Ensure cleanup
    };
  }, []);

  useEffect(() => {
    hereNow();
  }, []);

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
          name="map"
          options={{
            headerShown: false,
            tabBarLabel: "Xem bản đồ",
            tabBarIcon: (tabInfo) => (
              <Box
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: tabInfo.focused ? 'rgba(250, 183, 83, 0.1)' : 'transparent',
                }}
              >
                <MapIcon
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
                  backgroundColor: tabInfo.focused ? 'rgba(250, 183, 83, 0.1)' : 'transparent',
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
        {/* <Tabs.Screen name="requestMap" options={{ headerShown: false, href: null }} /> */}
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
      </Tabs>
    </GluestackUIProvider>
  );
}
