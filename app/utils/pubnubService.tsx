import PubNubReact from "pubnub";

type User = {
  uuid: string;
  username: string;
  email: string;
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
    message: {
      uuid: userId,
      username: user.username,
      role: user.role,
      latitude,
      longitude
    },
  });
};

export const subscribeToChannel = (pubnub: any, user: User, callback: any) => {
  pubnub.subscribe({ channels: ["global"], withPresence: true });

  pubnub.addListener({
    message: (msg: any) => {
      callback(msg);

      pubnub.objects.setUUIDMetadata({
        data: {
          name: user.username,
          email: user.email,
          custom: {
            "fullname": user.fullname,
            "role": user.role,
          }
        }
      });
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
      // console.log(response);
    }
  )
}

const pubnubService = {
  setupPubNub,
  publishLocation,
  subscribeToChannel,
  hereNow
};

export default pubnubService;
