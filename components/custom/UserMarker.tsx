import React from "react";
import MapboxGL from "@rnmapbox/maps";
import { View, StyleSheet } from "react-native";
import { Bike, Truck } from "lucide-react-native";
type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};
type UserMarkerComponentProps = {
  user: User;
};
const UserMarker: React.FC<UserMarkerComponentProps> = ({ user }) => {
  return (
    <MapboxGL.PointAnnotation id={user.uuid} coordinate={[user.longitude, user.latitude]}>
      <MapboxGL.Callout title={`${user.username} - ${user.role}`} />
      <View style={styles.iconContainer}>
        {user.role === "Customer" ? (
          <Bike color="#0080FF" size={28} style={styles.icon} />
        ) : (
          <Truck color="#FF8000" size={28} style={styles.icon} />
        )}
      </View>
    </MapboxGL.PointAnnotation>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    position: "absolute",
  },
});

export default UserMarker;
