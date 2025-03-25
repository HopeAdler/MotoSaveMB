import { CircleUserRound, MessageCircle, Phone } from "lucide-react-native";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Box } from "../ui/box";

interface RepairRequestDetail {
  requestid: string,
  requesttype: string,
  requestdetailid: string,
  requeststatus: string,
  totalprice: number | null,
  stationid: string,
  stationname: string,
  stationaddress: string,
  customerid: string,
  customername: string,
  customerphone: string,
  customeravatar: string
}

export const CustomerInfo = ({
  repairRequestDetail,
  toChatScreen,
  onCallPress
}: {
  repairRequestDetail?: RepairRequestDetail,
  toChatScreen: () => void,
  onCallPress: () => void
}) => {
  return (
    <Box className="p-5 rounded-xl border border-gray-300 shadow-sm bg-slate-00 flex-row items-center mb-4">
      {repairRequestDetail?.customeravatar === "" ? (
        <CircleUserRound color={'black'} size={75} />
      ) : (
        <Image src={repairRequestDetail?.customeravatar} className="w-[75px] h-[75px] rounded-full bg-gray-400 mr-4 border-2 border-white shadow-md" />
      )}

      <Box className="flex-1">
        <Text className="text-lg font-bold text-gray-900 mb-1 tracking-wide">
          {repairRequestDetail?.customername || "Unknown Customer"}
        </Text>

        <Box className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onCallPress} className="flex-row items-center">
            <Phone color="#007bff" size={18} />
            <Text className="text-base font-semibold text-blue-600 ml-2">
              {repairRequestDetail?.customerphone || "No phone number"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center bg-blue-500 px-5 py-2 rounded-full shadow-md active:opacity-75" onPress={toChatScreen}>
            <MessageCircle color="white" size={18} />
            <Text className="text-white text-sm font-semibold ml-2">Chat</Text>
          </TouchableOpacity>
        </Box>
      </Box>
    </Box>
  );
};