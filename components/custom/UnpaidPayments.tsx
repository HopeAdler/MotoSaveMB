import AuthContext from "@/app/context/AuthContext";
import {
  getUnpaidPaymentsByRequestId,
  updatePaymentStatus,
} from "@/app/services/beAPI";
import { formatMoney } from "@/app/utils/utils";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import {
  CheckCircle2,
  CreditCard,
  DollarSign,
  AlertCircle,
} from "lucide-react-native";
import { useContext, useEffect, useState } from "react";
import { Alert, FlatList, ActivityIndicator } from "react-native";

type UnpaidPaymentsProps = {
  requestId: string;
  onPaymentConfirmed?: () => void;
};

interface UnpaidPayments {
  paymentid: string;
  paymentmethod: string;
  paymentstatus: string;
  totalamount: number;
  requestdetailid: string;
  name: string;
  requestid: string;
}

const renderPaymentStatus = (paymentstatus: string | undefined) => {
  let paymentStatusText = "";
  let bgColor = "";
  let textColor = "";
  let Icon = null;

  switch (paymentstatus) {
    case "Unpaid":
      paymentStatusText = "Chưa thanh toán";
      bgColor = "bg-red-100";
      textColor = "text-red-600";
      Icon = AlertCircle;
      break;
    case "Success":
      paymentStatusText = "Đã thanh toán";
      bgColor = "bg-green-100";
      textColor = "text-green-600";
      Icon = CheckCircle2;
      break;
    default:
      paymentStatusText = "UNKNOWN";
      bgColor = "bg-gray-100";
      textColor = "text-gray-600";
      break;
  }

  return (
    <HStack
      className={`${bgColor} px-4 py-2 rounded-xl items-center space-x-1.5`}
    >
      {Icon && (
        <Icon
          size={16}
          color={paymentstatus === "Unpaid" ? "#dc2626" : "#16a34a"}
        />
      )}
      <Text className={`font-semibold ${textColor}`}>{paymentStatusText}</Text>
    </HStack>
  );
};

export const UnpaidPaymentList = ({
  requestId,
  onPaymentConfirmed,
}: UnpaidPaymentsProps) => {
  const { token } = useContext(AuthContext);
  const [unpaidPayments, setUnpaidPayments] = useState<UnpaidPayments[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);

  const fetchUnpaidPayments = async () => {
    try {
      setLoading(true);
      const results = await getUnpaidPaymentsByRequestId(requestId, token);
      setUnpaidPayments(results);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidPayments();
  }, []);

  const changePaymentStatus = async (
    requestDetailId: string,
    newStatus: string
  ) => {
    setIsButtonLoading(true);
    const payload = {
      requestDetailId,
      newStatus,
    };

    try {
      const result = await updatePaymentStatus(payload, token);
      if (result) {
        await fetchUnpaidPayments();
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
    } finally {
      setIsButtonLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!loading && unpaidPayments.length === 0) {
    return (
      <Box className="items-center justify-center py-8">
        <Text className="text-[#1a3148] font-medium text-center">
          Không có thanh toán nào cần xác nhận
        </Text>
      </Box>
    );
  }

  return (
    <FlatList
      scrollEnabled={false}
      data={unpaidPayments}
      keyExtractor={(item) => item.paymentid}
      renderItem={({ item }) => (
        <Box className="mb-5 p-5 bg-white rounded-2xl shadow-sm border border-gray-100/50">
          <Text className="text-xl font-bold text-[#1a3148] mb-3">
            {item?.name}
          </Text>

          <Box className="pt-4 border-t border-gray-100">
            <HStack className="justify-between items-center">
              <Text className="text-sm text-gray-500">Trạng thái:</Text>
              {renderPaymentStatus(item?.paymentstatus)}
            </HStack>
          </Box>

          <VStack className="space-y-5 gap-2">
            <HStack className="items-center space-x-3 gap-1">
              <Box className="w-10 h-10 bg-[#1a3148]/5 rounded-lg items-center justify-center">
                <DollarSign size={20} color="#1a3148" />
              </Box>
              <Text className="text-base text-[#1a3148] font-medium flex-1">
                Tổng tiền:{" "}
                <Text className="font-bold">
                  {formatMoney(item?.totalamount)}
                </Text>
              </Text>
            </HStack>

            <HStack className="items-center space-x-3 gap-1">
              <Box className="w-10 h-10 bg-[#1a3148]/10 rounded-lg items-center justify-center">
                <CreditCard size={20} color="#1a3148" />
              </Box>
              <Text className="text-base text-[#1a3148] font-medium flex-1">
                Phương thức:{" "}
                <Text className="font-semibold">{item?.paymentmethod}</Text>
              </Text>
            </HStack>
          </VStack>
          {item?.paymentstatus === "Unpaid" &&
            item?.paymentmethod === "Tiền mặt" && (
              <Box className="mb-4">
                <Button
                  className="bg-[#fab753] py-2 rounded-xl mt-2 w-full h-15 "
                  disabled={isButtonLoading}
                  onPress={() => {
                    Alert.alert(
                      "Xác nhận đã thanh toán",
                      "Khách hàng đã trả đủ tiền mặt cho bạn?",
                      [
                        {
                          text: "Hủy",
                          style: "cancel",
                        },
                        {
                          text: "Xác nhận",
                          onPress: () =>
                            changePaymentStatus(
                              item?.requestdetailid,
                              "Success"
                            ),
                        },
                      ]
                    );
                  }}
                >
                  <HStack className="items-center justify-center space-x-2 w-full">
                    {isButtonLoading ? (
                      <ActivityIndicator size="small" color="#1a3148" />
                    ) : (
                      <>
                        <Text className="text-[#1a3148] font-bold text-base">
                          Xác nhận đã nhận tiền
                        </Text>
                      </>
                    )}
                  </HStack>
                </Button>
              </Box>
            )}
        </Box>
      )}
    />
  );
};
