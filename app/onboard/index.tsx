import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

export default function OnBoardScreen() {
    const router = useRouter();

    return (
        <Box className='flex-1 justify-center items-center'>
            <Text bold size='2xl'>
                Welcome to My App bitches
                This is OnboardScreen
            </Text>
            <Button onPress={() =>  router.navigate("/auth/login")}> <Text> Login</Text> </Button>
        </Box>
    );
}
//Screen nay la cho cai viec gioi thieu app nhu cramata