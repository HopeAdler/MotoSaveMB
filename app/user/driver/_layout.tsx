import AuthContext from "@/app/context/AuthContext";
import { getCurrentLocation, requestLocationPermission, watchLocation } from "@/app/utils/locationService";
import { hereNow, publishLocation, setupPubNub, subscribeToChannel, subscribeToRescueChannel } from "@/app/utils/pubnubService";
import { decodedToken } from "@/app/utils/utils";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { Tabs, useRouter, useSegments } from "expo-router";
import { ChartArea, DollarSign, House, List } from "lucide-react-native";
import { useContext, useEffect, useRef, useState } from "react";

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
  const { user, token } = useContext(AuthContext);
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });
  const lastLocation = useRef({ latitude: 0, longitude: 0 });
  const userId = decodedToken(token)?.id;
  const [users, setUsers] = useState(new Map<string, User>());
  const [pendingReqDetailIds, setPendingReqDetailIds] = useState(new Map<string, string>());
  //PUBNUB intergration to publish location right after driver logged in
  const pubnub = setupPubNub(userId || "");
  const updateLocation = async (locationSubscription: any) => {
    if (await requestLocationPermission() && userId) {
      const location = await getCurrentLocation();
      if (
        location.coords.latitude !== lastLocation.current.latitude ||
        location.coords.longitude !== lastLocation.current.longitude
      ) {
        lastLocation.current = location.coords;
        setCurrentLoc(location.coords); // Only update state if the location actually changed
      }
      publishLocation(pubnub, userId, user, location.coords.latitude, location.coords.longitude);

      // Subscribe to live location updates
      locationSubscription = await watchLocation((position: any) => {
        if (
          position.coords.latitude !== lastLocation.current.latitude ||
          position.coords.longitude !== lastLocation.current.longitude
        ) {
          lastLocation.current = position.coords;
          setCurrentLoc(position.coords);
        }
        publishLocation(pubnub, userId, user, position.coords.latitude, position.coords.longitude);
      });
    }
  };
  useEffect(() => {
    let locationSubscription: any;

    // Initial call
    updateLocation(locationSubscription);
    // Set interval for 10s updates
    const intervalId = setInterval(updateLocation, 10000);
    return () => {
      clearInterval(intervalId);
      if (locationSubscription) locationSubscription.remove(); // Cleanup
    };
  }, []);

  useEffect(() => {
    // Update the params in requestMap when currentLoc changes
    if (segment.includes("requestMap")) {
      router.setParams({
        jsonCurLoc: JSON.stringify(currentLoc),
      });
    }
  }, [currentLoc]);

  useEffect(() => {
    //Render Users
    subscribeToChannel(
      pubnub,
      user,
      (msg: any) => {
        // Only the driver
        if (msg.publisher === userId) {
          setUsers((prev) => new Map(prev).set(msg.publisher, msg.message));
        }
      },
      (event: any) => {
        // Handle presence events
        if (event.action === "leave" || event.action === "timeout") {
          // Remove user when they disconnect
          setUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(event.uuid);
            return updated;
          });
        }
      }
    );
    //Render requests
    subscribeToRescueChannel(pubnub, (msg: any) => {
      if (msg.message.driverId === userId) {
        setPendingReqDetailIds((prev) => {
          const updatedMap = new Map(prev);
          updatedMap.set(msg.publisher, msg.message.requestDetailId);
          return new Map(updatedMap); // Ensures state change is detected
        });
      }
    });
    return () => {
      pubnub.unsubscribeAll();
      pubnub.destroy(); // Ensure the client fully stops sending heartbeats
    };
  }, []);

  useEffect(() => {
    if (segment.includes("home")) {
      router.setParams({
        jsonPendingReqDetailIds: JSON.stringify(Object.fromEntries(pendingReqDetailIds)),
      });
    }
  }, [pendingReqDetailIds]);

  useEffect(() => {
    hereNow(pubnub)
  }, [])

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
          name="request"
          options={{
            headerShown: false,
            tabBarLabel: "Yêu cầu",
            tabBarIcon: (tabInfo) => <List size={24} color={tabInfo.color} />,
          }}
        />
        <Tabs.Screen
          name="requestMap"
          options={{
            headerShown: false,
            href: null,
          }}
          initialParams={{
            jsonUsers: JSON.stringify(Object.fromEntries(users)),
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
      </Tabs>
    </GluestackUIProvider>
  );
}
