import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import React, { useContext } from "react";
import { AuthContext } from "@/app/context/AuthContext";

export default function MHomeScreen() {
  const { dispatch } = useContext(AuthContext);
  const handleLogout = async () => {
    dispatch?.({ type: "LOGOUT" });
    router.replace("/auth/login"); // Chuyển hướng về trang login
  };
  return (
    <Box className="flex-1 justify-center items-center">
      <Text bold size="2xl">
        Welcome to My App bitches This is HomeSCreen of mechanic
      </Text>
      <Button onPress={handleLogout}>
        <Text>Logout</Text>
      </Button>
    </Box>
  );
}

//  NAY LA MAN HINH TRANG CHU CUA MECHANIC
