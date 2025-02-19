import PubNubReact from "pubnub";

type User = {
  uuid: string;
  username: string;
  fullname: string;
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

export const subscribeToChannel = (pubnub: any, user: User, callback: any) => {
  pubnub.subscribe({ channels: ["global"], withPresence: true });

  pubnub.addListener({ message: callback });

  pubnub.objects.setUUIDMetadata({
    data: {
      name: user.username,
      custom: {
        fullname: user.fullname, // Assuming fullname is the same as username here
        role: user.role,
      },
    },
  });
};

export const hereNow = (pubnub: any) => {
  pubnub.hereNow(
    {
      channels: ["global"],
      includeState: true
    },
    function (status: any, response: any) {
      console.log(response);
    }
  )
}
