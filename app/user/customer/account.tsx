import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import React, { useContext } from "react";

export default function CSettingscreen() {
  const { user, dispatch } = useContext(AuthContext);
  const logout = () => {
    dispatch?.({ type: "LOGOUT" });
  };
  return (
    <Box className="flex-1 justify-center items-center">
      <Text bold size="2xl">
        Welcome to My App bitches This is AccountScreen of customer
      </Text>
      
    </Box>
  );
}

//  NAY LA MAN HINH SETTING ACCOUNT CUA CUSTOMER
