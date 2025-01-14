import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import  { useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import LoadingScreen from "../../loading/loading";


export default function CHomeScreen() {
  const { user, dispatch } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Đảm bảo chỉ kiểm tra khi user đã được tải xong
    if (!user) {
      return; // Nếu user chưa có, không làm gì
    }
    setIsLoading(false); // Khi có user, dừng loading
    if (user.role !== "Customer") {
      router.replace("/error/403"); // Chuyển đến trang lỗi 403 nếu role không hợp lệ
    }
  }, [user]);

  if (isLoading) {
    return (
      <LoadingScreen />
    );
  }
  const handleLogout = async () => {
    dispatch?.({ type: "LOGOUT" });
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
    router.replace("/auth/login"); // Chuyển hướng về trang login
  };



  return (
    <Box className="flex-1 justify-center items-center">
      <Text bold size="2xl">
        Welcome to My App bitches This is HomeScreen of customer
      </Text>
      <Button onPress={handleLogout}>
        <Text>Logout</Text>
      </Button>
    </Box>
  );
}

