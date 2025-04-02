import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from './loading/loading';

export default function SplashScreen() {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const checkUserData = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser);
        switch (user.role) {
          case "Customer":
            router.navigate("/user/customer/home/homepage");
            break;
          case "Driver":
            router.navigate("/user/driver/home");
            break;
          case "Mechanic":
            router.navigate("/user/mechanic/home");
            break;
          default:
            router.navigate("/error/404");
            break;
        }
      } else {
        router.navigate("/auth/login");
      }
    };

    const timeout = setTimeout(() => {
      checkUserData();
      setLoading(true);
    }, 3000); // Reduced to 3 seconds for better UX

    return () => clearTimeout(timeout);
  }, [router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box className="flex-1 bg-white items-center justify-center">
      <Box className="items-center">
        <Image
          source={require("../assets/images/logo.png")}
          style={{
            width: 200,
            height: 200,
            resizeMode: 'contain'
          }}
        />
        <Box className="mt-6">
          <Box className="h-2 w-2 bg-[#fab753] rounded-full animate-bounce" />
        </Box>
      </Box>
    </Box>
  );
}
