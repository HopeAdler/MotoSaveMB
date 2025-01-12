// import { Stack } from "expo-router";

// import "@/global.css";
// import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

// export default function RootLayout() {
//   return (
//     <GluestackUIProvider mode="light">
//       <Stack />
//     </GluestackUIProvider>
//   );
// }
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Stack } from "expo-router";
import { AuthContext, AuthContextProvider } from "./context/AuthContext";
import { useContext } from "react";
import React from "react";

export default function RootLayout() {
  const StackLayout = () => {
    const { user, token } = useContext(AuthContext);
    console.log(user);
    console.log(token);
    return (
      // <Stack>
      //     <Stack.Screen name="index" options={{ headerShown: false }} />
      //     <Stack.Screen name="onboard/index" options={{ headerShown: false }} />
      //     <Stack.Screen name="auth" options={{ headerShown: false }} />
      //     <Stack.Screen name="user/customer" options={{ headerShown: false }} />
      //     <Stack.Screen name="user/driver" options={{ headerShown: false }} />
      //     <Stack.Screen name="user/mechanic" options={{ headerShown: false }} />
      //   </Stack>
      <Stack>
        {!user ? (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="onboard/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
          </>
        ) : user?.role === "Customer" ? (
          <Stack.Screen name="user/customer" options={{ headerShown: false }} />
        ) : user?.role === "Driver" ? (
          <Stack.Screen name="user/driver" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="user/mechanic" options={{ headerShown: false }} />
        )}
      </Stack>
    );
  };

  return (
    <GluestackUIProvider mode="light">
      <AuthContextProvider>
        <StackLayout />
      </AuthContextProvider>
    </GluestackUIProvider>
  );
}
