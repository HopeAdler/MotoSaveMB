import PubNubReact from "pubnub";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { decodedToken } from "../utils/utils";
import AuthContext from "./AuthContext";

interface PubNubContextType {
  pubnub: PubNubReact | null;
}

interface PubNubProviderProps {
  children: ReactNode; // 👈 Define `children` properly
}

const PubNubContext = createContext<PubNubContextType | undefined>(undefined);

const { PUBNUB_PUBLISH_KEY } = process.env;
const { PUBNUB_SUBSCRIBE_KEY } = process.env;

export const PubNubProvider: React.FC<PubNubProviderProps> = ({ children }) => {
  const [pubnub, setPubnub] = useState<PubNubReact | null>(null);
  const { token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  useEffect(() => {
    if (userId) {
      const pubnubInstance = new PubNubReact({
        publishKey: PUBNUB_PUBLISH_KEY,
        subscribeKey: PUBNUB_SUBSCRIBE_KEY || "",
        uuid: userId,
      });
      setPubnub(pubnubInstance);

      return () => {
        pubnubInstance.unsubscribeAll();
        pubnubInstance.removeListener({});
        pubnubInstance.destroy();
      };
    }
  }, [userId]);

  return <PubNubContext.Provider value={{ pubnub }}>{children}</PubNubContext.Provider>;
};

export const usePubNub = (): PubNubContextType => {
  const context = useContext(PubNubContext);
  if (!context) {
    throw new Error("usePubNub must be used within a PubNubProvider");
  }
  return context;
};
