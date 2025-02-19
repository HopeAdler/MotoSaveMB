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
import { publishLocation, setupPubNub, subscribeToChannel } from "../../utils/pubnubService";

const { PUBNUB_PUBLISH_KEY } = process.env;
const { PUBNUB_SUBSCRIBE_KEY } = process.env;

const DTrackingScreen = () => {
  const { user, token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });
  const [users, setUsers] = useState(new Map());
  const [allowGPS, setAllowGPS] = useState(true);
  const pubnub = setupPubNub(PUBNUB_PUBLISH_KEY || "", PUBNUB_SUBSCRIBE_KEY || "", userId || "");

  useEffect(() => {
    (async () => {
      if (await requestLocationPermission() && userId) {
        const location = await getCurrentLocation();
        setCurrentLoc(location.coords);
        if (allowGPS) publishLocation(pubnub, userId, user, location.coords.latitude, location.coords.longitude);

        const locationSubscription = await watchLocation((position: any) => {
          setCurrentLoc(position.coords);
          if (allowGPS) publishLocation(pubnub, userId, user, position.coords.latitude, position.coords.longitude);
        });

        return () => locationSubscription.remove();
      }
    })();
  }, [allowGPS]);

  useEffect(() => {
    subscribeToChannel(pubnub, (msg: any) => {
      const data = msg.message;
      setUsers((prev) => new Map(prev).set(msg.publisher, data));
    });

    return () => pubnub.unsubscribeAll();
  }, []);
  return (
    <View style={styles.container}>
      <MapViewComponent users={users} currentLoc={currentLoc}/>
      <View style={styles.topBar}>
        <Text>Số người online: {users.size}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text>Nổ địa chỉ của tôi?</Text>
          <Switch value={allowGPS} onValueChange={() => setAllowGPS(!allowGPS)} />
        </View>
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
