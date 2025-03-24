import { useState, useEffect, useMemo } from "react";
import { Text, View } from "react-native";

interface RequestStatusProps {
    requestStatus: any; // Accepts both string and shared values
}

const RequestStatus: React.FC<RequestStatusProps> = ({ requestStatus }) => {
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (typeof requestStatus?.value === "string") {
            setStatus(requestStatus.value);
        } else {
            setStatus(requestStatus);
        }
    }, [requestStatus]);

    const statusColor = useMemo(() => {
        switch (status) {
            case "Accepted":
                return "bg-blue-500";
            case "Inspecting":
                return "bg-purple-500";
            case "Waiting":
                return "bg-yellow-500";
            case "Pickup":
                return "bg-pink-500";
            case "Repairing":
                return "bg-yellow-500";
            case "Processing":
                return "bg-yellow-500";
            case "Done":
                return "bg-green-500";
            case "Cancel":
                return "bg-red-500";
            default:
                return "bg-blue-300";
        }
    }, [status]);

    return (
        <View className={`absolute top-2 right-2 ${statusColor} px-2 py-1 rounded-full`}>
            <Text className="text-white text-xs font-bold">{status}</Text>
        </View>
    );
};

export default RequestStatus;
