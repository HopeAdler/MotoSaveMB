import * as Location from "expo-location"
//LOCATION SERVICE
export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
};

export const getCurrentLocation = async () => {
  return await Location.getCurrentPositionAsync({});
};

export const getCurrentHeading=async()=>{
  return await Location.getHeadingAsync();
}


export const watchLocation = async (callback: any) => {
  return await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 50 },
    callback
  );
};

const locationService = {
  requestLocationPermission,
  getCurrentLocation,
  watchLocation,
};

export default locationService;