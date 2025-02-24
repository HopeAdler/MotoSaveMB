import PubNubReact from "pubnub";

const { PUBNUB_PUBLISH_KEY } = process.env;
const { PUBNUB_SUBSCRIBE_KEY } = process.env;

type User = {
  uuid: string;
  username: string;
  email: string;
  fullname: string;
  role: string;
  latitude: number;
  longitude: number;
};

export const setupPubNub = (userId: string) => {
  return new PubNubReact({
    publishKey: PUBNUB_PUBLISH_KEY,
    subscribeKey: PUBNUB_SUBSCRIBE_KEY || "",
    userId,
    heartbeatInterval: 10,// The client will send a heartbeat every 10 seconds
    presenceTimeout: 20,
  });
};

export const publishLocation = (pubnub: any, userId: string, user: User, latitude: number, longitude: number, hideUser: boolean) => {
  pubnub.publish({
    channel: "global",
    message: {
      uuid: userId,
      username: user.username,
      role: user.role,
      latitude,
      longitude,
      isHidden: hideUser
    },
  });
};

export const subscribeToChannel = (
  pubnub: any,
  user: User,
  messageCallback: (msg: any) => void,
  presenceCallback?: (event: any) => void
) => {
  pubnub.subscribe({ channels: ["global"], withPresence: true });

  pubnub.addListener({
    message: (msg: any) => {
      messageCallback(msg);

      // Update UUID metadata (if needed)
      pubnub.objects.setUUIDMetadata({
        data: {
          name: user.username,
          email: user.email,
          custom: {
            fullname: user.fullname,
            role: user.role,
          },
        },
      });
    },
    presence: (event: any) => {
      // Forward the presence event if a callback is provided
      if (presenceCallback) {
        presenceCallback(event);
      }
    },
  });
};



export const hereNow = (pubnub: any) => {
  pubnub.hereNow(
    {
      channels: ["global"],
      includeUUIDs: true,
      includeState: true
    },
    function (status: any, response: any) {
      // console.log(response.channels.global.occupants);
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
