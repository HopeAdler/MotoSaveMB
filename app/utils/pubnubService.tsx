import PubNubReact from "pubnub";

type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};

export const setupPubNub = (publishKey: string, subscribeKey: string, userId: string) => {
  return new PubNubReact({
    publishKey,
    subscribeKey,
    userId,
  });
};

export const publishLocation = (pubnub: any, userId: string, user: User, latitude: number, longitude: number) => {
  pubnub.publish({
    channel: "global",
    message: { uuid: userId, username: user.username, role: user.role, latitude, longitude },
  });
};

export const subscribeToChannel = (pubnub: any, callback: any) => {
  pubnub.subscribe({ channels: ["global"], withPresence: true });
  pubnub.addListener({ message: callback });
};
