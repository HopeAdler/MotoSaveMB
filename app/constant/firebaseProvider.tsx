import { firebase } from '@react-native-firebase/app-check';
// Assuming you have already configured @react-native-firebase/app
// and have the necessary Firebase credentials set up in your project.

// Create a new React Native Firebase App Check provider
export const rnfbProvider = firebase.appCheck().newReactNativeFirebaseAppCheckProvider();
export const debugToken = process.env.EXPO_PUBLIC_DEBUG_TOKEN;
// Configure the provider based on the environment
rnfbProvider.configure({
  android: {
    // provider: __DEV__ ? 'debug' : 'playIntegrity',
    provider: 'debug',
    // Replace 'your-debug-token' with the actual debug token from your Firebase console
    debugToken,
  },
});
