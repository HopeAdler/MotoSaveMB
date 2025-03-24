// import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
// import { Stack } from "expo-router";
// import { AuthContext, AuthContextProvider } from "./context/AuthContext";
// import { useContext } from "react";
// import React from "react";

// export default function RootLayout() {
//   const StackLayout = () => {
//     const { user, token } = useContext(AuthContext);
//     console.log(user);
//     console.log(token);
//     return (
//       // <Stack>
//       //     <Stack.Screen name="index" options={{ headerShown: false }} />
//       //     <Stack.Screen name="onboard/index" options={{ headerShown: false }} />
//       //     <Stack.Screen name="auth" options={{ headerShown: false }} />
//       //     <Stack.Screen name="user/customer" options={{ headerShown: false }} />
//       //     <Stack.Screen name="user/driver" options={{ headerShown: false }} />
//       //     <Stack.Screen name="user/mechanic" options={{ headerShown: false }} />
//       //   </Stack>
//       <Stack>
//         <Stack.Screen name="error" options={{ headerShown: false }} />
//         {!user ? (
//           <>
//             <Stack.Screen name="index" options={{ headerShown: false }} />
//             <Stack.Screen name="onboard/index" options={{ headerShown: false }} />
//             <Stack.Screen name="auth" options={{ headerShown: false }} />
//           </>
//         ) : user?.role === "Customer" ? (
//           <Stack.Screen name="user/customer" options={{ headerShown: false }} />
//         ) : user?.role === "Driver" ? (
//           <Stack.Screen name="user/driver" options={{ headerShown: false }} />
//         ) : (
//           <Stack.Screen name="user/mechanic" options={{ headerShown: false }} />
//         )}
//       </Stack>
//     );
//   };

//   return (
//     <GluestackUIProvider mode="light">
//       <AuthContextProvider>
//         <StackLayout />
//       </AuthContextProvider>
//     </GluestackUIProvider>
//   );
// }

// import React, { useContext } from "react";
// import { Stack } from "expo-router";
// import { AuthContext } from "@/app/context/AuthContext";
// import SplashScreen from "@/app/loading/loading"; // Import màn hình Splash

// const StackLayout = () => {
//   const { user, loading } = useContext(AuthContext);

//   if (loading) {
//     // Hiển thị màn hình Splash trong khi dữ liệu auth đang được load
//     return <SplashScreen />;
//   }

//   return (
//     <Stack>
//       {/* Điều hướng dựa trên trạng thái user */}
//       {!user ? (
//         <>
//           <Stack.Screen name="index" options={{ headerShown: false }} />
//           <Stack.Screen name="auth/login" options={{ headerShown: false }} />
//           <Stack.Screen name="auth/register" options={{ headerShown: false }} />
//         </>
//       ) : user.role === "Customer" ? (
//         <Stack.Screen name="user/customer" options={{ headerShown: false }} />
//       ) : user.role === "Driver" ? (
//         <Stack.Screen name="user/driver" options={{ headerShown: false }} />
//       ) : (
//         <Stack.Screen name="user/mechanic" options={{ headerShown: false }} />
//       )}
//     </Stack>
//   );
// };

// export default StackLayout;

// import React, { useContext, useEffect } from "react";
// import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
// import { Stack } from "expo-router";
// import { AuthContext, AuthContextProvider } from "./context/AuthContext";
// import { useRouter } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// export default function RootLayout() {
//   const { user, token } = useContext(AuthContext);
//   const router = useRouter();

//   useEffect(() => {
//     const checkUserLoginStatus = async () => {
//       const storedUser = await AsyncStorage.getItem("user");
//       const storedToken = await AsyncStorage.getItem("token");

//       console.log(storedToken);
//       console.log(storedUser);
//       if (storedUser && storedToken) {
//         // User is logged in, automatically navigate based on role
//         const parsedUser = JSON.parse(storedUser);
//         switch (parsedUser.role) {
//           case "Customer":
//             router.replace("/user/customer/home");
//             break;
//           case "Driver":
//             router.replace("/user/driver/home");
//             break;
//           case "Mechanic":
//             router.replace("/user/mechanic/home");
//             break;
//           default:
//             // If no role matches, navigate to an error page or default route
//             router.replace("/error/404");
//             break;
//         }
//       } else {
//         // User is not logged in, navigate to the login page
//         router.replace("/auth/login");
//       }
//     };

//     checkUserLoginStatus();
//   }, [user, token]);

//   return (
//     <GluestackUIProvider mode="light">
//       <AuthContextProvider>
//         <Stack>
//           <Stack.Screen name="index" options={{ headerShown: false }} />
//           <Stack.Screen name="onboard/index" options={{ headerShown: false }} />
//           <Stack.Screen name="auth" options={{ headerShown: false }} />
//         </Stack>
//       </AuthContextProvider>
//     </GluestackUIProvider>
//   );
// }
import React, { useContext } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Stack } from "expo-router";
import { AuthContextProvider } from "./context/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PubNubProvider } from "./context/PubNubContext";
import { RequestContextProvider } from "./context/RequestContext";

export default function RootLayout() {
  // Không cần check token và user ở đây nữa
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode="light">
        <AuthContextProvider>
          <RequestContextProvider>
          <PubNubProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="onboard/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="error" options={{ headerShown: false }} />
            <Stack.Screen name="user" options={{ headerShown: false }} />
          </Stack>
          </PubNubProvider>
          </RequestContextProvider>
        </AuthContextProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
