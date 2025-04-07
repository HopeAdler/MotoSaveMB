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
    <Box className="p-5 rounded-2xl border border-gray-100/50 shadow-sm bg-white mb-4">
      <Box className="flex-row items-center">
        {repairRequestDetail?.customeravatar === "" ? (
          <Box className="w-20 h-20 bg-[#1a3148]/5 rounded-xl items-center justify-center mr-4">
            <CircleUserRound color="#1a3148" size={36} />
          </Box>
        ) : (
          <Image 
            source={{ uri: repairRequestDetail?.customeravatar }} 
            className="w-20 h-20 rounded-xl bg-gray-100 mr-4 border border-gray-100/50"
          />
        )}

        <Box className="flex-1">
          <Text className="text-lg font-bold text-[#1a3148] mb-2">
            {repairRequestDetail?.customername || "Unknown Customer"}
          </Text>

          <TouchableOpacity 
            onPress={onCallPress} 
            className="flex-row items-center"
            accessibilityLabel={`Call ${repairRequestDetail?.customername}`}
            accessibilityRole="button"
          >
            <Phone color="#64748b" size={16} />
            <Text className="text-gray-600 ml-2">
              {repairRequestDetail?.customerphone || "No phone number"}
            </Text>
          </TouchableOpacity>
        </Box>

        <TouchableOpacity 
          className="bg-[#fab753] px-4 py-2.5 rounded-xl shadow-sm active:opacity-90"
          onPress={toChatScreen}
          accessibilityLabel={`Chat with ${repairRequestDetail?.customername}`}
          accessibilityRole="button"
        >
          <Box className="flex-row items-center">
            <MessageCircle color="white" size={18} />
            <Text className="text-white font-semibold ml-2">Chat</Text>
          </Box>
        </TouchableOpacity>
      </Box>
    </Box>
  );
};