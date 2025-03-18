import ChatViewComponent from "@/components/custom/ChatViewComponent";
import { GoBackButton } from "@/components/custom/GoBackButton";
import { Box } from "@/components/ui/box";
import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

const ChatScreen = () => {
  const { currentUserId, requestDetailId } = useLocalSearchParams();

  if (!currentUserId || !requestDetailId) {
    return null; // Prevent rendering if any parameter is missing
  }

  return (
    <Box className="flex-1">
      <GoBackButton />
      <Text>Chat với tài xế</Text>
      <ChatViewComponent
        currentUserId={currentUserId as string}
        requestDetailId={requestDetailId as string}
      />
    </Box>
  );
}

export default ChatScreen;
