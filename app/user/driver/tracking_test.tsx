import { AuthContext } from "@/app/context/AuthContext";
import { decodedToken } from "@/app/utils/utils";
import MapViewComponent from "@/components/custom/MapViewComponent";
import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { getCurrentLocation, requestLocationPermission, watchLocation } from "../../utils/locationService";
import { hereNow, publishLocation, setupPubNub, subscribeToChannel } from "../../utils/pubnubService";

type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};

const { PUBNUB_PUBLISH_KEY } = process.env;
const { PUBNUB_SUBSCRIBE_KEY } = process.env;

const DTrackingScreen = () => {
  const { user, token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });
  const [users, setUsers] = useState(new Map<string, User>());
  const pubnub = setupPubNub(PUBNUB_PUBLISH_KEY || "", PUBNUB_SUBSCRIBE_KEY || "", userId || "");
  const [focusOnMe, setFocusOnMe] = useState(false);

  const updateLocation = async (locationSubscription: any) => {
    if (await requestLocationPermission() && userId) {
      const location = await getCurrentLocation();
      setCurrentLoc(location.coords);
      publishLocation(pubnub, userId, user, location.coords.latitude, location.coords.longitude);

      // Subscribe to live location updates
      locationSubscription = await watchLocation((position: any) => {
        setCurrentLoc(position.coords);
        publishLocation(pubnub, userId, user, position.coords.latitude, position.coords.longitude);
      });
      // console.log('Location updated')
    }
  };

  useEffect(() => {
    let locationSubscription: any;

    // Initial call
    updateLocation(locationSubscription);
    // Set interval for 10s updates
    const intervalId = setInterval(updateLocation, 5000);
    return () => {
      clearInterval(intervalId);
      if (locationSubscription) locationSubscription.remove(); // Cleanup
    };
  }, []);


  useEffect(() => {
    subscribeToChannel(pubnub, user, (msg: any) => {
      const data = msg.message;
      setUsers((prev) => new Map(prev).set(msg.publisher, data));
    });

    return () => pubnub.unsubscribeAll();
  }, []);

  useEffect(() => {
    hereNow(pubnub)
  }, [users])

  return (
    <View style={styles.container}>
      <MapViewComponent users={users} currentLoc={currentLoc} focusMode={[focusOnMe, setFocusOnMe]} />
      <View style={styles.topBar}>
        <Text>Số người online: {users.size}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: "absolute",
    top: hp("2%"),
    flexDirection: "column",
    alignItems: "flex-end",
    width: "100%",
    paddingHorizontal: wp("5%"),
  },
});

export default DTrackingScreen;
