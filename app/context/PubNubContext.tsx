import { Chat } from "@pubnub/chat";
import PubNub from "pubnub";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    if (userId) {
      const initPubNubAndChat = async () => {
        // Initialize PubNub
        const pubnubInstance = new PubNub({
          publishKey: process.env.EXPO_PUBLIC_PUBNUB_PUBLISH_KEY,
          subscribeKey: process.env.EXPO_PUBLIC_PUBNUB_SUBSCRIBE_KEY || "",
          uuid: userId,
        });
        setPubnub(pubnubInstance);

        try {
          // Await the Chat initialization
          const chatInstance = await Chat.init({
            publishKey: process.env.EXPO_PUBLIC_PUBNUB_PUBLISH_KEY,
            subscribeKey: process.env.EXPO_PUBLIC_PUBNUB_SUBSCRIBE_KEY || "",
            uuid: userId,
          });
          setChat(chatInstance);
        } catch (error) {
          console.error("Error initializing Chat:", error);
        }
      };

      initPubNubAndChat();

      return () => {
        if (pubnub) {
          pubnub.unsubscribeAll();
          pubnub.removeListener({});
          pubnub.destroy();
        }
      };
    }
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
