import { Image } from "react-native";
import { Text, View } from "react-native";

export const VehicleInfoBox = ({ repairRequestDetail }: any) => {
    return (
        <View style={{ padding: 16, borderRadius: 12, borderWidth: 0.5 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Thông tin xe:</Text>

            <Text style={{ fontSize: 16, marginBottom: 4 }}>Biển số:
                <Text style={{fontWeight: "500", color:'darkgreen'}}> {repairRequestDetail?.licenseplate}</Text>
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 4 }}>Tình trạng: {repairRequestDetail?.vehiclecondition || "Đang sửa chữa"}</Text>

            {repairRequestDetail?.vehiclephoto ? (
                <Image
                    source={{ uri: repairRequestDetail.vehiclephoto }}
                    style={{ width: '100%', height: 200, borderRadius: 8, marginTop: 8 }}
                    resizeMode="cover"
                />
            ) : (
                <Text style={{ fontSize: 16, fontStyle: 'italic', color: '#888', marginTop: 8 }}>Chưa có ảnh</Text>
            )}
        </View>
    );
};