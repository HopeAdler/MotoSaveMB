import { usePubNub } from "@/app/context/PubNubContext";
import { usePubNubService } from "@/app/services/pubnubService";
import { Channel, Message, TimetokenUtils, User } from "@pubnub/chat";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type ChatViewComponentProps = {
  currentUserId: string,
  requestDetailId: string
};


const ChatViewComponent: React.FC<ChatViewComponentProps> = ({
  currentUserId,
  requestDetailId
}) => {
  const { chat } = usePubNub();
  const {
    getChannel,
    fetchMessageHistory
  } = usePubNubService();
  // const [chat, setChat] = useState<Chat | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const lastFetchedChannelId = useRef<string | null>(null);

  const fetchChannel = async () => {
    const fetchedChannel = await getChannel(requestDetailId);
    if (fetchedChannel) {
      setChannel(fetchedChannel);
    }
  };

  useEffect(() => {
    fetchChannel();
  }, [requestDetailId]);


  const initializeChat = useCallback(async () => {
    if (!chat) {
      console.log("Chat not initialized");
      return;
    }

    if (!channel) {
      console.log("Channel not initialized yet");
      return;
    }

    try {
      // Fetch members dynamically
      const channelUsers = await channel.getMembers();

      if (!channelUsers || !channelUsers.members || channelUsers.members.length === 0) {
        console.error("No members found in the channel");
        return;
      }

      // Extract users from members
      const userList = channelUsers.members.map((member) => member.user);

      setUsers(userList);
    } catch (error) {
      console.error("Error fetching channel members:", error);
    }
  }, [chat, channel]);




  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    if (!channel || !channel?.id) return;

    if (channel.id !== lastFetchedChannelId.current) {
      lastFetchedChannelId.current = channel.id;
      fetchMessageHistory(channel.id, (msg) => {
        const formattedMsg = msg?.message || msg;
        if (formattedMsg) {
          setMessages((prevMessages) => [...prevMessages, formattedMsg]);
        }
      });
    }

    const unsubscribe = channel.connect((message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => unsubscribe();
  }, [channel]);

  const sendMessage = async () => {
    if (text && channel) {
      await channel.sendText(text);
      setText("");
    }
  };

  const renderChatItem = ({ item }: { item: Message }) => {
    const messageUser = users.find((user) => user.id === item.userId);
    const isCurrentUser = item.userId === currentUserId;

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft]}>
        <View style={styles.userInfo}>
          {!isCurrentUser && messageUser && (
            <Image source={{ uri: `${messageUser.custom?.avatar || null}` }} style={styles.avatar} />
          )}
          <View style={[styles.messageWrapper, isCurrentUser ? styles.messageWrapperRight : styles.messageWrapperLeft]}>
            {!isCurrentUser && <Text style={styles.username}>{messageUser?.name}</Text>}
            <View style={[styles.messageContent, isCurrentUser ? styles.messageContentRight : styles.messageContentLeft]}>
              <Text style={styles.messageText}>{item.content.text}</Text>
              <Text style={styles.messageTime}>{TimetokenUtils.timetokenToDate(item.timetoken).toLocaleTimeString()}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <Text style={styles.header}> Chat channel: {channel?.name}</Text>
      <FlatList data={messages}
        keyExtractor={(item) => item.timetoken.toString()}
        renderItem={renderChatItem} />
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Type a message" />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f3f7" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  messageContainer: { marginVertical: 8 },
  messageContainerLeft: { alignItems: "flex-start" },
  messageContainerRight: { alignItems: "flex-end" },
  userInfo: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 6,
    borderWidth: 2,
    borderColor: "lightgreen"
  },
  username: { fontSize: 12, color: "#666", marginBottom: 2 }, // Smaller username above the message
  messageWrapper: { maxWidth: "75%" },
  messageWrapperLeft: { alignSelf: "flex-start" },
  messageWrapperRight: { alignSelf: "flex-end" },
  messageContent: { borderRadius: 10, padding: 10 },
  messageContentLeft: { backgroundColor: "#FAC05B", alignSelf: "flex-start" },
  messageContentRight: { backgroundColor: "#0078FF", alignSelf: "flex-end" },
  messageText: { fontSize: 14, color: "#fff" },
  messageTime: { fontSize: 10, color: "#ccc", marginTop: 2 },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10 },
  input: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 10 },
  sendButton: { marginLeft: 10, padding: 10, backgroundColor: "#de2440", borderRadius: 10 },
  sendButtonText: { color: "#fff" },
});

export default ChatViewComponent;