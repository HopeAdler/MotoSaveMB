import { FontAwesome } from "@expo/vector-icons";
import { Text, View } from "react-native";

const getStatusStyleAndText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'inspecting':
      return {
        backgroundColor: '#d4edda',
        color: '#155724',
        icon: 'check-square-o',
        text: 'Đang kiểm tra tình trạng xe'
      }; // Magnifying glass for inspecting
    case 'waiting':
      return {
        backgroundColor: '#fff3cd',
        color: '#856404',
        icon: 'hourglass-half',
        text: 'Đợi khách hàng chấp nhận báo giá'
      }; // Hourglass for waiting
    case 'accepted':
      return {
        backgroundColor: '#d4edda',
        color: '#155724',
        icon: 'thumbs-up',
        text: 'Báo giá đã được chấp nhận'
      }; // Thumbs up for accepted
    case 'repairing':
      return {
        backgroundColor: '#a8d7da',
        color: '#721c24',
        icon: 'wrench',
        text: 'Đang tiến hành sửa chữa'
      }; // Tools icon for repairing
    case 'cancel':
      return {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        icon: 'ban',
        text: 'Khách hàng đã hủy'
      }; // Ban icon for canceled
    case 'done':
      return {
        backgroundColor: '#c3e6cb',
        color: '#155724',
        icon: 'check-circle',
        text: 'Sửa chữa hoàn tất!'
      }; // Check circle for done
    default:
      return {
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        icon: 'info-circle',
        text: 'UNKNOWN'
      }; // Default info icon
  }
};


export const RepairStatusBadge = ({ status }: { status?: string }) => {  // <-- Allow undefined
  const { backgroundColor, color, icon, text } = getStatusStyleAndText(status || "default"); // Provide a default

  return (
    <View style={{
      backgroundColor,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10
    }}>
      <FontAwesome name={icon as keyof typeof FontAwesome.glyphMap} size={16} color={color} style={{ marginRight: 6 }} />
      <Text style={{ color, fontWeight: 'bold', fontSize: 14 }}>
        {text}
      </Text>
    </View>
  );
};