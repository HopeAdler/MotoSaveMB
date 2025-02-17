import React, { useState, useEffect, useRef, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import PubNubReact from "pubnub";
import { Bike, LocateFixed } from "lucide-react-native";
import { AuthContext } from "@/app/context/AuthContext";

// const { MAPBOX_ACCESS_TOKEN, PUBNUB_PUBLISH_KEY, PUBNUB_SUBSCRIBE_KEY } = process.env;
const { MAPBOX_ACCESS_TOKEN } = process.env;
const { PUBNUB_PUBLISH_KEY } = process.env;
const { PUBNUB_SUBSCRIBE_KEY } = process.env;
const latitudeDelta = 0.025;
const longitudeDelta = 0.025;

// Set Mapbox Access Token
MapboxGL.setAccessToken(`${MAPBOX_ACCESS_TOKEN}`);

type PubNubMessage = {
  latitude: number;
  longitude: number;
  hideUser?: boolean;
};

const CTrackingScreen = () => {
  // console.log(MAPBOX_ACCESS_TOKEN, PUBNUB_PUBLISH_KEY)
  const { user } = useContext(AuthContext);
  console.log(user)
  const [currentLoc, setCurrentLoc] = useState({ latitude: 0, longitude: 0 });
  const [users, setUsers] = useState(new Map());
  const [userCount, setUserCount] = useState(0);
  const [allowGPS, setAllowGPS] = useState(true);
  const [focusOnMe, setFocusOnMe] = useState(false);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const pubnub = new PubNubReact({
    publishKey: PUBNUB_PUBLISH_KEY,
    subscribeKey: PUBNUB_SUBSCRIBE_KEY || "",
    userId: "49c4901e-1300-437e-a877-39a575d8a275", //driver1
    // userId: "e74c2597-ed78-44d4-a2da-fb5c38a112ed", //bigbaballs
  });


  const publishLocation = (latitude: number, longitude: number) => {
    pubnub.publish({
      channel: "global",
      message: {
        uuid: "49c4901e-1300-437e-a877-39a575d8a275", //driver1
        // uuid: "e74c2597-ed78-44d4-a2da-fb5c38a112ed", //bigbaballs
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
          const updatedUsers = new Map(prevUsers);
          if (data.hideUser) {
            updatedUsers.delete(msg.publisher);
          } else {
            updatedUsers.set(msg.publisher, {
              uuid: msg.publisher,
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
          // console.log('Updated user: ' + users.forEach(u => {
          //   u.uuid
          // }));
          return updatedUsers;
        });
      },
    });

    return () => {
      pubnub.unsubscribeAll();
    };
  }, []);

  useEffect(() => {
    // pubnub.hereNow({ includeUUIDs: true, includeState: true }, (status, response) => {
    //   setUserCount(response?.totalOccupancy ?? users.size);
    //   console.log(response)
    // });
    pubnub.hereNow(
      {
        channels: ["global"],
        includeState: true
      },
      function (status, response) {
        // console.log(status);
        console.log(response);
      }
    )
    const userData = pubnub.objects.getUUIDMetadata();;
    console.log(userData)
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
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map} ref={mapRef}>
        <MapboxGL.Camera ref={cameraRef} zoomLevel={10} centerCoordinate={[currentLoc.longitude, currentLoc.latitude]} />

        {Array.from(users.values()).map((item) => (
          <MapboxGL.PointAnnotation key={item.uuid} id={item.uuid} coordinate={[item.longitude, item.latitude]}>
            <Bike color="#0080FF" size={28} />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      <View style={styles.topBar}>
        <Text>{userCount}</Text>
        <Switch value={allowGPS} onValueChange={() => setAllowGPS(!allowGPS)} />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
