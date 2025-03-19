import { Chat } from "@pubnub/chat";
import PubNub from "pubnub";
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { decodedToken } from "../utils/utils";
import AuthContext from "./AuthContext";

interface PubNubContextType {
  pubnub: PubNub | null;
  chat: Chat | null;
}

interface PubNubProviderProps {
  children: ReactNode;
}

const PubNubContext = createContext<PubNubContextType | undefined>(undefined);

export const PubNubProvider: React.FC<PubNubProviderProps> = ({ children }) => {
  const [pubnub, setPubnub] = useState<PubNub | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const { token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;

  // Using refs to ensure cleanup uses the latest instance
  const pubnubRef = useRef<PubNub | null>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    if (!userId) return;

    const initPubNubAndChat = async () => {
      // Initialize PubNub
      const pubnubInstance = new PubNub({
        publishKey: process.env.EXPO_PUBLIC_PUBNUB_PUBLISH_KEY,
        subscribeKey: process.env.EXPO_PUBLIC_PUBNUB_SUBSCRIBE_KEY || "",
        uuid: userId,
        heartbeatInterval: 10,
        presenceTimeout: 20
      });
      setPubnub(pubnubInstance);
      pubnubRef.current = pubnubInstance; // Store reference

      try {
        // Initialize Chat
        const chatInstance = await Chat.init({
          publishKey: process.env.EXPO_PUBLIC_PUBNUB_PUBLISH_KEY,
          subscribeKey: process.env.EXPO_PUBLIC_PUBNUB_SUBSCRIBE_KEY || "",
          uuid: userId,
        });
        setChat(chatInstance);
        chatRef.current = chatInstance; // Store reference
      } catch (error) {
        console.error("Error initializing Chat:", error);
      }
    };

    initPubNubAndChat();

    return () => {
      console.log("Cleaning up PubNub and Chat...");
      
      if (pubnubRef.current) {
        pubnubRef.current.unsubscribeAll();
        // pubnubRef.current.removeListener({});
        pubnubRef.current.destroy();
        console.log("PubNub destroyed.");
      }

      // if (chatRef.current) {
      //   chatRef.current.disconnect(); // Ensure chat instance is properly closed
      //   console.log("Chat instance disconnected.");
      // }

      setPubnub(null);
      setChat(null);
    };
  }, [userId]);

  return (
    <PubNubContext.Provider value={{ pubnub, chat }}>
      {children}
    </PubNubContext.Provider>
  );
};

export const usePubNub = (): PubNubContextType => {
  const context = useContext(PubNubContext);
  if (!context) {
    throw new Error("usePubNub must be used within a PubNubProvider");
  }
  return context;
};
