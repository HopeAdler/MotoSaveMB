import { usePubNubService } from "@/app/services/pubnubService";
import { Channel, Chat, Message, TimetokenUtils, User } from "@pubnub/chat";
import React, { useEffect, useState, useCallback } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const { EXPO_PUBLIC_PUBNUB_PUBLISH_KEY, EXPO_PUBLIC_PUBNUB_SUBSCRIBE_KEY } = process.env;

const userData = [
    {
        id: "support-agent",
        data: { name: "John (Support Agent)", custom: { initials: "SA", avatar: "#9fa7df" } },
    },
    {
        id: "supported-user",
        data: { name: "Mary Watson", custom: { initials: "MW", avatar: "#ffab91" } },
    },
];

export default function CustomerChatScreen() {
    const {
        fetchMessageHistory
    } = usePubNubService();
    // Maintain a state to determine the active user (0 or 1)
    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const activeUser = userData[currentUserIndex];
    const otherUser = userData[1 - currentUserIndex];

    const [chat, setChat] = useState<Chat>();
    const [channel, setChannel] = useState<Channel>();
    const [users, setUsers] = useState<User[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");

    // Initialize the chat instance based on the active user
    const initializeChat = useCallback(async () => {
        if (!EXPO_PUBLIC_PUBNUB_PUBLISH_KEY || !EXPO_PUBLIC_PUBNUB_SUBSCRIBE_KEY) {
            console.error("Missing PubNub keys");
            return;
        }

        // Clear previous messages when switching users.
        // setMessages([]);

        // Initialize Chat with the active user
        const chatInstance = await Chat.init({
            publishKey: EXPO_PUBLIC_PUBNUB_PUBLISH_KEY,
            subscribeKey: EXPO_PUBLIC_PUBNUB_SUBSCRIBE_KEY,
            userId: activeUser.id,
        });

        // Update the current user's data.
        await chatInstance.currentUser.update(activeUser.data);

        // Get or create the other user.
        const interlocutor =
            (await chatInstance.getUser(otherUser.id)) ||
            (await chatInstance.createUser(otherUser.id, otherUser.data));

        // Create a direct conversation.
        const conversation = await chatInstance.createDirectConversation({
            user: interlocutor,
            channelData: { name: "Support Channel" },
        });

        setUsers([chatInstance.currentUser, interlocutor]);
        setChat(chatInstance);
        console.log('Channel set: ' + conversation.channel.name)
        setChannel(conversation.channel);
    }, [activeUser, otherUser]);

    useEffect(() => {
        initializeChat();
    }, [initializeChat]);

    // Subscribe to incoming messages.
    useEffect(() => {
        if (!channel || !channel.name) return; // Ensure channel and name exist

        console.log("Subscribed to Channel: " + channel.name);

        const fetchHistoryAndSubscribe = async () => {
            try {
                const history = await fetchMessageHistory(channel.name || "");
                console.log(history)
                setMessages(history as Message[]); // Type assertion to avoid TypeScript warnings
            } catch (error) {
                console.error("Failed to fetch message history:", error);
            }
        };

        fetchHistoryAndSubscribe();

        // Subscribe to real-time messages
        const unsubscribe = channel.connect((message: Message) => {
            console.log(message);
            setMessages((messages) => [...messages, message]);
        });

        return () => unsubscribe(); // Clean up on unmount
    }, [channel]);

    const sendMessage = async () => {
        if (text && channel) {
            const result = await channel.sendText(text);
            console.log(result)
            setText("");
        }
    };

    // Function to switch the active user.
    const switchUser = () => {
        setCurrentUserIndex((prevIndex) => 1 - prevIndex);
    };

    // Render each message with avatar, sender name, timestamp, and text.
    const renderItem = ({ item }: { item: Message }) => {
        const messageUser = users.find((user) => user.id === item.userId);
        const isCurrentUser = item.userId === activeUser.id; // Replace `currentUser.id` with the actual state variable

        return (
            <View style={[styles.messageContainer, isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft]}>
                {!isCurrentUser && (
                    <View style={[styles.avatar, { backgroundColor: `${messageUser?.custom?.avatar || "#ccc"}` }]}>
                        <Text style={styles.avatarText}>{messageUser?.custom?.initials || "NA"}</Text>
                    </View>
                )}
                <View style={[styles.messageContent, isCurrentUser ? styles.messageContentRight : styles.messageContentLeft]}>
                    <View style={styles.messageHeader}>
                        {!isCurrentUser && <Text style={styles.messageSender}>{messageUser?.name || "Unknown"}</Text>}
                        <Text style={styles.messageTime}>
                            {TimetokenUtils.timetokenToDate(item.timetoken).toLocaleTimeString([], { timeStyle: "short" })}
                        </Text>
                    </View>
                    <Text style={styles.messageText}>{item.content.text}</Text>
                </View>
            </View>
        );
    };


    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>{channel?.name}</Text>
                <TouchableOpacity onPress={switchUser} style={styles.switchButton}>
                    <Text style={styles.switchButtonText}>Switch User</Text>
                </TouchableOpacity>
            </View>

            {channel && <Text style={styles.channelName}>{channel.name}</Text>}
            {chat && <Text style={styles.currentUserName}>Logged in as: {chat.currentUser.name}</Text>}

            <FlatList
                data={messages}
                keyExtractor={(item) => item.timetoken.toString()}
                renderItem={renderItem}
            />

            {channel && chat &&
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="Type a message"
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f0f3f7" },
    headerContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    switchButton: { padding: 8, backgroundColor: "#de2440", borderRadius: 5 },
    switchButtonText: { color: "#fff" },
    channelName: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
    currentUserName: { fontSize: 14, color: "#333", marginBottom: 10 },
    messageContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginVertical: 8,
    },
    messageContainerLeft: {
        justifyContent: "flex-start",
    },
    messageContainerRight: {
        justifyContent: "flex-end",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        color: "#53FA1E",
        backgroundColor: "#53FA1E",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    avatarText: { color: "#53FA1E", fontWeight: "bold" },
    messageContent: {
        maxWidth: "75%", // Prevents full-width messages
        borderRadius: 10,
        padding: 10,
    },
    messageContentLeft: {
        backgroundColor: "#FAC05B",
        alignSelf: "flex-start",
    },
    messageContentRight: {
        backgroundColor: "#0078FF",
        alignSelf: "flex-end",
        color: "#fff",
    },
    messageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    messageSender: { fontWeight: "bold" },
    messageTime: { fontSize: 12, color: "#666" },
    messageText: { fontSize: 14, color: "#fff" },
    inputContainer: { flexDirection: "row", alignItems: "center", padding: 10 },
    input: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 10 },
    sendButton: { marginLeft: 10, padding: 10, backgroundColor: "#de2440", borderRadius: 10 },
    sendButtonText: { color: "#fff" },
});
