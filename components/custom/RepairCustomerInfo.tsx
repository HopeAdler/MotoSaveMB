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
        <Box style={styles.customerContainer}>
            {repairRequestDetail?.customeravatar == "" ?
                <CircleUserRound color={'black'} size={75} />
                :
                <Image src={repairRequestDetail?.customeravatar} style={styles.avatar} />
            }
            <Box style={{ flexDirection: 'column', flex: 1 }}>
                {/* Customer Name */}
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#222", marginBottom: 6 }}>
                    {repairRequestDetail?.customername || "Unknown Customer"}
                </Text>

                {/* Phone Number with Icon */}
                <Box style={{ flexDirection: "row", alignItems: "center", justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={onCallPress} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Phone color="#007bff" size={15} />
                        <Text style={{ fontSize: 15, color: "#007bff", fontWeight: "600", marginLeft: 6 }}>
                            {repairRequestDetail?.customerphone || "No phone number"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#007bff", // Blue color for chatting
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                        }}
                        onPress={toChatScreen}
                    >
                        <MessageCircle color="white" size={16} />
                        <Text style={{ color: "white", fontSize: 14, fontWeight: "600", marginLeft: 6 }}>Chat</Text>
                    </TouchableOpacity>
                </Box>
            </Box>
        </Box>
    );
};
const styles = StyleSheet.create({
    customerContainer: {
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "flex-start",
        borderWidth: 0.5,
        marginBottom: 10
    },
    avatar: {
        width: 75,
        height: 75,
        borderRadius: 50,
        backgroundColor: "gray",
        marginRight: 10,
    },
})