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
      <View className={`my-2 ${isCurrentUser ? "items-end" : "items-start"}`}>
        <View className="flex-row items-center mb-1">
          {!isCurrentUser && messageUser && (
            <Image
              source={{ uri: `${messageUser?.profileUrl || null}` }}
              className="w-10 h-10 rounded-full border-2 border-green-400 mr-2"
            />
          )}
          <View className={`max-w-[75%] ${isCurrentUser ? "self-end" : "self-start"}`}>
            {!isCurrentUser && <Text className="text-xs text-gray-600 mb-1">{messageUser?.name}</Text>}
            <View className={`p-3 rounded-lg ${isCurrentUser ? "bg-blue-500" : "bg-yellow-400"}`}>
              <Text className="text-white text-sm">{item.content.text}</Text>
              <Text className="text-[10px] text-gray-300 mt-1">
                {TimetokenUtils.timetokenToDate(item.timetoken).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 px-5 bg-gray-100">
      {/* Header */}
      {/* <Text className="text-xl font-bold my-4">Kênh chat riêng tư: {channel?.name}</Text> */}

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.timetoken.toString()}
        renderItem={renderChatItem}
        className="flex-1"
      />

      {/* Chat Input */}
      <View className="flex-row items-center p-3 bg-white rounded-xl shadow-md">
        <TextInput
          className="flex-1 bg-gray-100 p-3 rounded-lg"
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <TouchableOpacity
          onPress={sendMessage}
          className="ml-3 p-3 bg-red-500 rounded-lg shadow-md"
        >
          <Text className="text-white font-bold">Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default ChatViewComponent;