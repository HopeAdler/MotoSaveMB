import AuthContext from '@/app/context/AuthContext';
import { getUnpaidPaymentsByRequestId, updatePaymentStatus } from '@/app/services/beAPI';
import { formatMoney } from '@/app/utils/utils';
import { Button } from '@/components/ui/button';
import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';

type UnpaidPaymentsProps = {
  requestId: string;
};

interface UnpaidPayments {
  paymentid: string,
  paymentmethod: string,
  paymentstatus: string,
  totalamount: number,
  requestdetailid: string,
  name: string,
  requestid: string
}
const renderPaymentStatus = (paymentstatus: string | undefined) => {
  let paymentStatusText = "";
  let bgColor = "";

  switch (paymentstatus) {
    case "Unpaid":
      paymentStatusText = "Chưa thanh toán";
      bgColor = "bg-red-100 text-red-600";
      break;
    case "Success":
      paymentStatusText = "Đã thanh toán";
      bgColor = "bg-green-100 text-green-600";
      break;
    default:
      paymentStatusText = "UNKNOWN";
      bgColor = "bg-gray-100 text-gray-600";
      break;
  }

  return (
    <Text className={`p-2 rounded-md font-semibold text-center ${bgColor}`}>
      {paymentStatusText}
    </Text>
  );
};


export const UnpaidPaymentList = ({ requestId }: UnpaidPaymentsProps) => {
  const { token } = useContext(AuthContext);
  // const { requestId, unpaidPaymentsStr } = useLocalSearchParams<{
  //   requestId: string;
  //   unpaidPaymentsStr: string;
  // }>();
  // const parsedUnpaidPayments = unpaidPaymentsStr ? JSON.parse(unpaidPaymentsStr) : [];
  const [unpaidPayments, setUnpaidPayments] = useState<UnpaidPayments[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

    const fetchUnpaidPayments = async () => {
      console.log('reqId: ' + requestId)
      try {
        const results = await getUnpaidPaymentsByRequestId(requestId, token);
        setUnpaidPayments(results);
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchUnpaidPayments()
    }, [])
    const changePaymentStatus = async (requestDetailId: string, newStatus: string) => {
      const payload = {
        requestDetailId,
        newStatus
      };
      const result = await updatePaymentStatus(payload, token);
      setLoading(true)
      if (result) fetchUnpaidPayments();
    };
    return (
      <FlatList
        scrollEnabled={false}
        data={unpaidPayments}
        keyExtractor={(item) => item.paymentid}
        renderItem={({ item }) => (
          <View className="mb-6 p-4 bg-white shadow-md rounded-lg">
            <Text className="text-green-600 font-semibold">{item?.name}</Text>
            <Text className="text-green-600 font-semibold">💰 Tổng tiền: {formatMoney(item?.totalamount)}</Text>
            <Text className="text-blue-600 font-semibold">💳 Phương thức: {item?.paymentmethod}</Text>
            {renderPaymentStatus(item?.paymentstatus)}
            {(item?.paymentstatus === 'Unpaid' && item?.paymentmethod === 'Tiền mặt') && (
              <Button
                className="bg-orange-500 mt-3 w-full p-3 rounded"
                size="lg"
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
                        onPress: () => changePaymentStatus(item?.requestdetailid, "Success"),
                      },
                    ]
                  );
                }}
              >
                <Text className="text-white text-center font-semibold">✅ Xác nhận thanh toán</Text>
              </Button>
            )}
          </View>
        )}
      />
    )
}
