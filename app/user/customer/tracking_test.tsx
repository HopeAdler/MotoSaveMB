import { AuthContext } from "@/app/context/AuthContext";
import { decodedToken } from "@/app/utils/utils";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { Bike, LocateFixed, Truck } from "lucide-react-native";
import PubNubReact from "pubnub";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

// const { MAPBOX_ACCESS_TOKEN, PUBNUB_PUBLISH_KEY, PUBNUB_SUBSCRIBE_KEY } = process.env;
const { MAPBOX_ACCESS_TOKEN } = process.env;
const { PUBNUB_PUBLISH_KEY } = process.env;
const { PUBNUB_SUBSCRIBE_KEY } = process.env;

// Set Mapbox Access Token
MapboxGL.setAccessToken(`${MAPBOX_ACCESS_TOKEN}`);

type PubNubMessage = {
  latitude: number;
  longitude: number;
  hideUser?: boolean;
};

type User = {
  uuid: string,
  username: string,
  role: string,
  latitude: number,
  longitude: number,
}

const CTrackingScreen = () => {
  // console.log(MAPBOX_ACCESS_TOKEN, PUBNUB_PUBLISH_KEY)
  const { user, token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });
  const [users, setUsers] = useState(new Map<string, User>());
  const [allowGPS, setAllowGPS] = useState(true);
  const [focusOnMe, setFocusOnMe] = useState(false);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const pubnub = new PubNubReact({
    publishKey: PUBNUB_PUBLISH_KEY,
    subscribeKey: PUBNUB_SUBSCRIBE_KEY || "",
    userId,
  });


  const publishLocation = (latitude: number, longitude: number) => {
    pubnub.publish({
      channel: "global",
      message: {
        uuid: userId || "",
        username: user.username || "",
        role: user.role || "",
        latitude,
        longitude,
      },
    });
  };

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLoc(location.coords);
      if (allowGPS) publishLocation(location.coords.latitude, location.coords.longitude);

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 50 },
        (position) => {
          setCurrentLoc(position.coords);
          if (allowGPS) publishLocation(position.coords.latitude, position.coords.longitude);
        }
      );
    };

    getLocation();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [allowGPS]);

  useEffect(() => {
    pubnub.subscribe({ channels: ["global"], withPresence: true });
    pubnub.addListener({
      message: (msg) => {
        const data = msg.message as PubNubMessage;
        console.log(data)
        setUsers((prevUsers) => {
          const updatedUsers = prevUsers;
          if (data.hideUser) {
            updatedUsers.delete(msg.publisher || "");
          } else {
            updatedUsers.set((msg.publisher || ""), {
              uuid: msg.publisher || "",
              username: user.username,
              role: user.role,
              latitude: data.latitude,
              longitude: data.longitude,
            });
          }
          pubnub.objects.setUUIDMetadata({
            data: {
              name: user.username,
              email: user.email,
              custom: {
                "fullname": user.fullname,
                "role": user.role,
              }
            }
          });
          return updatedUsers;
        });
      },
    });

    return () => {
      pubnub.unsubscribeAll();
    };
  }, []);

  useEffect(() => {
    pubnub.hereNow(
      {
        channels: ["global"],
        includeState: true
      },
      function (status, response) {
        console.log('Herenow function returning..');
        console.log(response?.channels["global"]);
      }
    )
  }, [users]);

  const focusLoc = () => {
    setFocusOnMe(!focusOnMe);
    if (focusOnMe && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLoc.longitude, currentLoc.latitude],
        zoomLevel: 14,
        animationDuration: 2000,
      });
    }
    console.log("Current Users: " + users.size)
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map} ref={mapRef}>
        <MapboxGL.Camera ref={cameraRef} zoomLevel={10} centerCoordinate={[currentLoc.longitude, currentLoc.latitude]} />

        {Array.from(users.values()).map((u) => (
          <MapboxGL.PointAnnotation key={u.uuid} id={u.uuid} coordinate={[u.longitude, u.latitude]}>
            <MapboxGL.Callout title={`${u.username} - ${u.role}`} />
            {u.role === 'Customer' ? (
              <Bike color="#0080FF" size={28} />
            ) : (
              <Truck color="#FF8000" size={28} />
            )}
          </MapboxGL.PointAnnotation>
        ))}


      </MapboxGL.MapView>

      <View style={styles.topBar}>
        <Text>Số người online: {users.size}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text>Nổ địa chỉ của tôi?</Text>
          <Switch value={allowGPS} onValueChange={() => setAllowGPS(!allowGPS)} />
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity onPress={focusLoc}>
          <LocateFixed color="#0080FF" size={28} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: {
    position: "absolute",
    top: hp("2%"),
    flexDirection: "column",
    alignItems: "flex-end",
    width: "100%",
    paddingHorizontal: wp("5%"),
  },
  bottom: {
    position: "absolute",
    bottom: hp("4%"),
    alignSelf: "center",
  },
});

export default CTrackingScreen;
