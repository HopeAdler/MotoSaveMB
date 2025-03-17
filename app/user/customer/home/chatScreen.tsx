import { router, useLocalSearchParams } from "expo-router";
import ChatViewComponent from "@/components/custom/ChatViewComponent";
import { Pressable, Text } from "react-native";
import { ChevronLeft } from "lucide-react-native";

const ChatScreen = () => {
    const { currentUserId, requestDetailId } = useLocalSearchParams();

    if (!currentUserId || !requestDetailId) {
        return null; // Prevent rendering if any parameter is missing
    }

    return (
        <>
            <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
            >
                <ChevronLeft size={24} color="#374151" />
            </Pressable>
            <Text>Chat với tài xế</Text>
            <ChatViewComponent
                currentUserId={currentUserId as string}
                requestDetailId={requestDetailId as string}
            />
        </>
    );
}

export default ChatScreen;
