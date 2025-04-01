import React from "react";
import MapboxGL from "@rnmapbox/maps";
import { View, StyleSheet } from "react-native";
import { Bike, Truck } from "lucide-react-native";
import { User } from "../../app/context/formFields";
// type User = {
//   uuid: string;
//   username: string;
//   role: string;
//   latitude: number;
//   longitude: number;
// };
type UserMarkerComponentProps = {
  user: User;
};
const UserMarker: React.FC<UserMarkerComponentProps> = ({ user }) => {
  if (user.role === "Driver") {
    {(console.log(user))}
    return (
      <MapboxGL.MarkerView id={user.uuid} coordinate={[user.longitude, user.latitude]}>
        <View style={{ transform: [{ rotate: `${user.heading}deg` }] }}>
          <Truck color="#FF8000" size={28} style={styles.icon} />
        </View>
      </MapboxGL.MarkerView>
    );
  } else {
    return null;
  }
};


const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    // position: "absolute",
    // transform: [{ rotate: "45deg" }],
  },
});

export default UserMarker;
