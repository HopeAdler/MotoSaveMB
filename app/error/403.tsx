import { AuthContext } from "@/app/context/AuthContext";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import React, { useContext, useEffect, useState } from "react";
import { router } from "expo-router";

export default function E403Screen() {
  const { user, dispatch } = useContext(AuthContext);
  // const logout = () => {
  //   dispatch?.({ type: "LOGOUT" });
  // };
  return (
    <Box className="flex-1 justify-center items-center">
      <Text bold size="2xl">
        TEST 403 SCREEN
      </Text>
      <Button onPress={() => router.replace("/")}>
        <Text>Logout</Text>
      </Button>
    </Box>
  );
}

//  NAY LA MAN HINH TRANG CHU CUA CUSTOMER
