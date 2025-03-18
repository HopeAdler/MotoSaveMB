import { router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import { Pressable } from "react-native"
import { Box } from "../ui/box"

export const GoBackButton = () => {
    return (
        <Box className="absolute top-4 left-4 z-20">
            <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
            >
                <ChevronLeft size={24} color="#374151" />
            </Pressable>
        </Box>
    )
}