import { Channel } from "@pubnub/chat";
import { usePubNub } from "../context/PubNubContext"; // Ensure correct path

type User = {
  uuid: string;
  username: string;
  email: string;
  fullname: string;
  role: string;
  latitude: number;
  longitude: number;
};

export const usePubNubService = () => {
  const { pubnub, chat } = usePubNub();
  if (!pubnub) {
    throw new Error("PubNub instance is not available");
  }

  const publishLocation = (userId: string, user: User, latitude: number, longitude: number, heading: number) => {
    pubnub.publish({
      channel: "global",
      message: {
        uuid: userId,
        username: user.username,
        role: user.role,
        latitude,
        longitude,
        heading,
      },
    });
  };

  const publishRescueRequest = (driverId: string, requestDetailId: string) => {
    pubnub.publish({
      channel: "rescue-service",
      message: {
        senderRole: "Customer",
        driverId,
        requestDetailId,
      },
    });
  };

  const publishAcceptRequest = (requestDetailId: string): Promise<any> => {
    return pubnub.publish({
      channel: "rescue-service",
      message: {
        senderRole: "Driver",
        requestDetailId,
        reqStatus: 'Accepted',
      },
    });
  };

  const publishCancelRescueForCust = (requestDetailId: string, reason: string): Promise<any> => {
    return pubnub.publish({
      channel: "rescue-service",
      message: {
        senderRole: "Customer",
        requestDetailId,
        reqStatus: 'Cancel',
        reason,
      },
    });
  };

  const subscribeToChannel = (user: User, messageCallback: (msg: any) => void, presenceCallback?: (event: any) => void) => {
    pubnub.subscribe({ channels: ["global"], withPresence: true });

    pubnub.addListener({
      message: (msg: any) => {
        if (msg.channel === "global") {
          messageCallback(msg);
        }
      },
      presence: (event: any) => {
        // Forward the presence event if a callback is provided
        if (presenceCallback) {
          presenceCallback(event);
        }
      },
    });
  };

  const subscribeToRescueChannel = (messageCallback: (msg: any) => void) => {
    pubnub.subscribe({ channels: ["rescue-service"], withPresence: true });

    pubnub.addListener({
      message: (msg: any) => {
        if (msg.channel === "rescue-service") {
          messageCallback(msg);
        }
      },
    });
  };

  const hereNow = () => {
    pubnub.hereNow(
      {
        channels: ["global"],
        includeUUIDs: true,
        includeState: true,
      },
      (status, response) => {
        console.log(response);
      }
    );
  };

  //Create new direct channel with requestDetailId
  const createDirectChannel = async (
    invitedUserId: string,
    requestDetailId: string,
  ) => {
    try {
      if (chat) {
        const invitedUser = await chat.getUser(invitedUserId);
        if (invitedUser) {
          await chat.createDirectConversation({
            user: invitedUser,
            channelId: requestDetailId,
          });
        }
      }
    } catch (error) {
      console.error("Error initializing direct channel:", error);
    }
  };

  const getChannel = async (channelId: string): Promise<Channel | null> => {
    try {
      if (!chat) {
        console.error("Chat instance not available");
        return null;
      }

      const channel = await chat.getChannel(channelId);
      if (!channel) {
        console.error("Channel not found:", channelId);
        return null;
      }

      return channel;
    } catch (error) {
      console.error("Error fetching channel:", error);
      return null;
    }
  };


  const fetchMessageHistory = async (
    channelId: string,
    messageCallback: (msg: any) => void
  ) => {
    try {
      if (chat) {
        const channel = await chat.getChannel(channelId);
        if (!channel) {
          console.error("Channel not found:", channelId);
          return;
        }

        const history = await channel.getHistory({
          count: 10, // Number of messages to fetch
        });

        if (history?.messages?.length) {
          history.messages.forEach((msg) => {
            messageCallback(msg);
          });
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };



  return {
    publishLocation,
    publishRescueRequest,
    publishAcceptRequest,
    publishCancelRescueForCust,
    subscribeToChannel,
    subscribeToRescueChannel,
    hereNow,
    createDirectChannel,
    getChannel,
    fetchMessageHistory,
  };
};
