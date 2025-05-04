import { acceptRepairRequest } from "@/app/services/beAPI";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Router } from "expo-router";
import moment from "moment";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import { Clock, Phone, User } from "lucide-react-native";
import { StatusBadge } from "@/components/custom/StatusBadge";
import React from "react";

interface RepairRequestItemProps {
  requestid: string;
  customername: string;
  customerphone: string;
  receivername: string;
  receiverphone: string;
  requesttype: string;
  servicepackagename: string;
  requestdetailid: string;
  requeststatus: string;
  createddate: string;
}

export const RepairRequestItem = React.memo(
  (props: { token: string; item: RepairRequestItemProps; router: Router }) => {
    const { token, item, router } = props;

    return (
      <Box className="bg-white p-5 mb-4 rounded-2xl shadow-sm border border-gray-100/50">
        <Box className="flex-row items-center justify-between mb-3">
          <Text
            className="text-[#fab753] text-lg font-bold flex-1 mr-2"
            numberOfLines={1}
          >
            {item.servicepackagename}
          </Text>
          <StatusBadge status={item.requeststatus} />
        </Box>

        <Box className="flex-row items-center mb-3">
          <Box className="w-10 h-10 bg-[#1a3148]/5 rounded-xl items-center justify-center mr-3">
            <User color="#1a3148" size={18} />
          </Box>
          {item.customername ? (
            <Text
              className="text-[#1a3148] text-lg font-bold flex-1"
              numberOfLines={1}
            >
              {item.customername}
            </Text>
          ) : (
            <Text
              className="text-[#1a3148] text-lg font-bold flex-1"
              numberOfLines={1}
            >
              {item.receivername}
            </Text>
          )}
        </Box>

        <Box className="pl-1 mb-4">
          <Box className="flex-row items-center mb-2">
            <Phone size={16} color="#64748b" style={styles.icon} />
            {item.customerphone ? (
              <Text className="text-gray-600" numberOfLines={1}>
                {item.customerphone}
              </Text>
            ) : (
              <Text className="text-gray-600" numberOfLines={1}>
                {item.receiverphone}
              </Text>
            )}
          </Box>

          <Box className="flex-row items-center">
            <Clock size={16} color="#64748b" style={styles.icon} />
            <Text className="text-gray-500" numberOfLines={1}>
              {moment(item.createddate).format("DD/MM/YYYY HH:mm")}
            </Text>
          </Box>
        </Box>

        {item.requeststatus === "Pending" ? (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={async () => {
              try {
                await acceptRepairRequest(item.requestdetailid, token);
                Alert.alert(
                  "Success",
                  "Request accepted and notification sent!"
                );
              } catch (apiError: any) {
                Alert.alert("Error", apiError);
              }
            }}
          >
            <Text style={styles.buttonText}>Chấp nhận</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() =>
              router.push({
                pathname: "/user/mechanic/requests/repairRequestDetails",
                params: {
                  requestDetailId: item.requestdetailid.toString(),
                  requestId: item.requestid.toString(),
                },
              })
            }
          >
            <Text style={styles.buttonText}>Xem chi tiết</Text>
          </TouchableOpacity>
        )}
      </Box>
    );
  }
);

export function renderRepairRequestItem(props: {
  token: string;
  item: RepairRequestItemProps;
  router: Router;
}) {
  return <RepairRequestItem {...props} />;
}

const styles = StyleSheet.create({
  icon: {
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: "#1a3148",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  viewButton: {
    backgroundColor: "#fab753",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
});
