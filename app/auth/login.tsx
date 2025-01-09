import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

export default function LoginScreen() {
    const router = useRouter();

    return (
        <Box className='flex-1 justify-center items-center'>
            <Text bold size='2xl'>
                Welcome to My App bitches
                This is LoginScreen
            </Text>
            <Button onPress={() =>  router.navigate("/auth/register")}> <Text> Register</Text> </Button>
        </Box>
    );
}
//Screen nay la cho cai viec gioi thieu app nhu cramata