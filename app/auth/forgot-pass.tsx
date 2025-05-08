import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

export default function ForgotPassScreen() {
    const router = useRouter();

    return (
        <Box className='flex-1 justify-center items-center'>
            <Text bold size='2xl'>
                Welcome to MotorSave
                This is ForgotPassScreen
            </Text>
            <Button onPress={() =>  router.navigate("/auth/login")}> <Text>Login</Text> </Button>
        </Box>
    );
}
//Screen nay la cho cai viec recover password (nay co lam hay ko thi idk, add vao trc)