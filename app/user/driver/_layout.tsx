import AuthContext from "@/app/context/AuthContext";
import { getCurrentLocation, requestLocationPermission, watchLocation } from "@/app/services/locationService";
import { usePubNubService } from "@/app/services/pubnubService"; // ✅ Use the custom hook
import { decodedToken } from "@/app/utils/utils";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { Tabs, useRouter, useSegments } from "expo-router";
import { ChartArea, DollarSign, House, List, CircleUserRound } from "lucide-react-native";
import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};

export default function DriverLayout() {
  const router = useRouter();
  const segment = useSegments<any>();
  const {
    publishLocation,
    subscribeToChannel,
    subscribeToRescueChannel,
    hereNow,
  } = usePubNubService(); // ✅ Get service functions
  const { user, token } = useContext(AuthContext);

  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0, heading: 0 });
  const lastLocation = useRef({ latitude: 0, longitude: 0, heading: 0 });
  
  const userId = decodedToken(token)?.id;
  const [users, setUsers] = useState(new Map<string, User>());
  const [pendingReqDetailIds, setPendingReqDetailIds] = useState(new Map<string, string>());

  const updateLocation = async (locationSubscription: any) => {
    if (await requestLocationPermission() && userId) {
      const location = await getCurrentLocation();
      const { latitude, longitude, heading } = location.coords;

      const newLocation = {
        latitude,
        longitude,
        heading: heading ?? 0, // Ensure heading is never null
      };

      if (
        newLocation.latitude !== lastLocation.current.latitude ||
        newLocation.longitude !== lastLocation.current.longitude ||
        newLocation.heading !== lastLocation.current.heading
      ) {
        lastLocation.current = newLocation;
        setCurrentLoc(newLocation);
      }

      publishLocation(userId, user, latitude, longitude, newLocation.heading);

      // Subscribe to live location updates
      locationSubscription = await watchLocation((position: any) => {
        const { latitude, longitude, heading } = position.coords;
        const updatedLocation = {
          latitude,
          longitude,
          heading: heading ?? 0, // Ensure heading is never null
        };

        if (
          updatedLocation.latitude !== lastLocation.current.latitude ||
          updatedLocation.longitude !== lastLocation.current.longitude ||
          updatedLocation.heading !== lastLocation.current.heading
        ) {
          lastLocation.current = updatedLocation;
          setCurrentLoc(updatedLocation);
        }

        publishLocation(userId, user, latitude, longitude, updatedLocation.heading);
      });
    }
  };


  useEffect(() => {
    if (token) {
      axios.get("https://motor-save-be.vercel.app/api/v1/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(err => {
        console.log('Prefetch error:', err);
      });
    }
  }, [token]);

  useEffect(() => {
    let locationSubscription: any;

    updateLocation(locationSubscription);
    const intervalId = setInterval(updateLocation, 10000);

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
          setUsers((prev) => new Map(prev).set(msg.publisher, msg.message));
        }
      },
      (event: any) => {
        if (event.action === "leave" || event.action === "timeout") {
          setUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(event.uuid);
            return updated;
          });
        }
      }
    );

    // Listen to requests from PubNub
    subscribeToRescueChannel((msg: any) => {
      if (msg.message.senderRole === "Customer" && msg.message.driverId === userId) {
        setPendingReqDetailIds((prev) => {
          const updatedMap = new Map(prev);
          updatedMap.set(msg.publisher, msg.message.requestDetailId);
          return new Map(updatedMap);
        });
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

  useEffect(() => {
    if (segment.includes("home")) {
      router.setParams({
        jsonPendingReqDetailIds: JSON.stringify(Object.fromEntries(pendingReqDetailIds)),
      });
    } else if (segment.includes("requestMap")) {
      router.setParams({
        jsonCurLoc: JSON.stringify(currentLoc),
        jsonUsers: JSON.stringify(Object.fromEntries(users)),
      });
    }
  }, [pendingReqDetailIds, currentLoc, users, segment]);

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
        {/* <Tabs.Screen name="requestMap" options={{ headerShown: false, href: null }} /> */}
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
