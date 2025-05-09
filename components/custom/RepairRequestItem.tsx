import { acceptRepairRequest } from "@/app/services/beAPI";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Router } from "expo-router";
import moment from "moment";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar, Clock, Phone, User } from "lucide-react-native";
import { StatusBadge } from "@/components/custom/StatusBadge";
import React from "react";
import { Button, ButtonText } from "../ui/button";

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
          <Box>
            <Text className="text-lg font-bold text-[#1a3148]">
              {item.servicepackagename}
            </Text>
            <Text className="text-sm font-medium text-gray-500">
              {item.requesttype}
            </Text>
          </Box>
          <Box className="gap-1">
            <Box className="bg-[#1a3148]/10 px-3 py-1 rounded-full">
              <Text className="text-[#1a3148] text-xs font-medium">
                {moment(item.createddate).format("HH:mm")}
              </Text>
            </Box>
            <StatusBadge status={item.requeststatus} />
          </Box>
        </Box>

        <Box className="flex-row items-center mb-3">
          <Box className="w-10 h-10 bg-[#1a3148]/5 rounded-xl items-center justify-center mr-3">
            <User color="#1a3148" size={18} />
          </Box>
          {item.customername ? (
            <Text className="text-base text-[#1a3148] font-medium">
              {item.customername}
            </Text>
          ) : (
            <Text className="text-base text-[#1a3148] font-medium">
              {item.receivername}
            </Text>
          )}
        </Box>

        <Box className="pl-1 mb-4">
          {/* <Box className="flex-row items-center mb-2">
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
          </Box> */}

          <Box className="flex-row items-center">
            <Calendar size={16} color="#64748b" style={styles.icon} />
            <Text className="text-gray-500" numberOfLines={1}>
              {moment(item.createddate).format("DD/MM/YYYY")}
            </Text>
          </Box>
        </Box>

        {item.requeststatus === "Pending" ? (
          <Button
            variant="solid"
            className="bg-[#fab753] rounded-xl h-12 active:opacity-80"
            onPress={async () => {
              try {
                await acceptRepairRequest(item.requestdetailid, token);
                Alert.alert("Success", "Đã chấp nhận yêu cầu!");
              } catch (apiError: any) {
                Alert.alert("Error", apiError);
              }
            }}
          >
            <ButtonText className="text-[#1a3148] font-bold">
              Chấp nhận
            </ButtonText>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-[#1a3148] rounded-xl h-12 active:opacity-80"
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
            <ButtonText className="text-[#1a3148] font-semibold">
              Xem chi tiết
            </ButtonText>
          </Button>
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
