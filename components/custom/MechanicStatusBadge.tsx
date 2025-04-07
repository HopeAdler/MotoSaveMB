import { FontAwesome } from "@expo/vector-icons";
import { Text, View } from "react-native";

const getStatusStyleAndText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'inspecting':
      return {
        backgroundColor: '#f3f4f6',
        color: '#374151',
        icon: 'search',
        text: 'Inspecting'
      };
    case 'waiting':
      return {
        backgroundColor: '#fff3cd',
        color: '#856404', 
        icon: 'hourglass-half',
        text: 'Waiting'
      };
    case 'accepted':
      return {
        backgroundColor: '#d4edda',
        color: '#155724',
        icon: 'thumbs-up',
        text: 'Accepted'
      };
    case 'repairing':
      return {
        backgroundColor: '#cce5ff',
        color: '#004085',
        icon: 'wrench',
        text: 'Repairing'
      };
    case 'done':
      return {
        backgroundColor: '#c3e6cb', 
        color: '#155724',
        icon: 'check-circle',
        text: 'Completed'
      };
    case 'cancel':
      return {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        icon: 'ban',
        text: 'Cancelled'
      };
    default:
      return {
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        icon: 'info-circle',
        text: 'Pending'
      };
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