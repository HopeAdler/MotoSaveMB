import { ExpoConfig } from "@expo/config";

const config: ExpoConfig = {
  owner: "moto_save",
  name: "MotoSave-mb",
  slug: "motorsave",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.hopeadler.MotoSavemb",
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken:
          "sk.eyJ1IjoiaG9wZWFkbGVyIiwiYSI6ImNtNWNicjFtcjI0Ym4yc3FyeHpweGVma2MifQ.31e7OcW36KpivxgB0YC7yg",
        RNMapboxMapsVersion: "11.0.0",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow MotoSave-mb to use your location.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos",
      },
    ],
    "expo-font",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "d3249292-c843-4bd4-bfed-947818a21653",
    },
  },
};

export default config;
