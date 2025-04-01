import React from "react";
import MapboxGL from "@rnmapbox/maps";
import { View, Image } from "react-native";
import { User } from "../../app/context/formFields";

type UserMarkerComponentProps = {
  user: User;
};

const UserMarker: React.FC<UserMarkerComponentProps> = ({ user }) => {
  if (user.role === "Driver") {
    // console.log(user);
    return (
      <MapboxGL.MarkerView
        id={user.uuid}
        coordinate={[user.longitude, user.latitude]}
      >
        <View
          className="w-28 h-28  rounded-lg overflow-visible items-center justify-center"
          style={{ transform: [{ rotate: `${user.heading}deg` }] }}
        >
          <Image
            source={require("../../assets/images/truck.png")}
            className="w-16 h-16 p-2"
            resizeMode="contain"
          />
        </View>

      </MapboxGL.MarkerView>
    );
  } else {
    return null;
  }
};

export default UserMarker;
