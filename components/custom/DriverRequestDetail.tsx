import { formatMoney, handlePhoneCall } from "@/app/utils/utils";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { CreditCard, MapPin, MapPinCheckInsideIcon, MessageSquare, Phone } from "lucide-react-native";
import React, { useContext, useEffect, useState } from 'react';
import { UnpaidPaymentList } from './UnpaidPayments';
import { ScrollView } from "react-native-gesture-handler";
import AuthContext from '@/app/context/AuthContext';
import { getUnpaidPaymentsByRequestId } from '@/app/services/beAPI';
import { ActivityIndicator } from "react-native";

interface RequestDetail {
  requestid: string;
  servicepackagename: string;
  requesttype: string;
  customername: string;
  customerphone: string;
  receivername: string;
  receiverphone: string;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  paymentmethod: string;
  paymentstatus: string;
  requeststatus: string;
}

interface DriverRequestDetailProps {
  requestDetail: RequestDetail;
  changeButtonTitle: () => string;
  toChatScreen: () => void;
}

const DriverRequestDetail: React.FC<DriverRequestDetailProps> = ({
  requestDetail,
  changeButtonTitle,
  toChatScreen
}) => {
  const { token } = useContext(AuthContext);
  const [unpaidCashPayments, setUnpaidCashPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUnpaidCashPayments = async () => {
      if (requestDetail?.requestid) {
        try {
          const results = await getUnpaidPaymentsByRequestId(requestDetail.requestid, token);
          const unpaidCash = results.filter(
            (payment:any) => payment.paymentstatus === 'Unpaid' && payment.paymentmethod === 'Tiền mặt'
          );
          setUnpaidCashPayments(unpaidCash);
        } catch (error) {
          console.error("Error fetching payments:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUnpaidCashPayments();
  }, [requestDetail?.requestid, token]);

  const refreshPayments = async () => {
    setLoading(true);
    if (requestDetail?.requestid) {
      try {
        const results = await getUnpaidPaymentsByRequestId(requestDetail.requestid, token);
        const unpaidCash = results.filter(
          (payment: any) => payment.paymentstatus === 'Unpaid' && payment.paymentmethod === 'Tiền mặt'
        );
        setUnpaidCashPayments(unpaidCash);
      } catch (error) {
        console.error("Error refreshing payments:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  
  if (loading) {
    return (
      <Box className="space-y-4 w-full h-2/5">
        <Box className="flex items-center justify-center w-full h-full">
          <ActivityIndicator size="large" color="#fab753" />
        </Box>
      </Box>
    );
  }
  if (unpaidCashPayments.length > 0) {
    return (
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
        <Box className="pt-16 px-4 pb-4 border-b border-gray-100">
          <Text className="text-2xl font-bold text-[#1a3148]">Xác nhận thanh toán</Text>
        </Box>
        
        <Box className="flex-1 flex justify-center items-center p-4">
          <Box className="bg-[#f8fafc] rounded-2xl p-5 shadow-sm w-full">
            <UnpaidPaymentList 
              requestId={requestDetail?.requestid || ''} 
              onPaymentConfirmed={refreshPayments}
            />
          </Box>
        </Box>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <Box className="pt-16 px-4 pb-4 border-b border-gray-100">
        <Box className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-[#1a3148]">Request Details</Text>
          <Box className="px-3 py-1.5 bg-green-100/80 rounded-full">
            <Text className="text-sm text-green-600 font-semibold">Completed</Text>
          </Box>
        </Box>
      </Box>

      <Box className="flex-1 px-4">
        <Box className="space-y-5 py-5">
          <Box className="bg-[#f8fafc] rounded-2xl p-5">
            <Box className="flex-row items-center justify-between mb-4">
              <Box className="flex-1">
                <Text className="text-xs uppercase text-gray-500 tracking-wider mb-1">Khách hàng</Text>
                <Text className="text-2xl font-bold text-[#1a3148]">
                  {requestDetail?.customername ? requestDetail?.customername : requestDetail?.receivername}
                </Text>
              </Box>
              <Box className="flex-row gap-3">
                <Button
                  variant="solid"
                  onPress={() => handlePhoneCall(requestDetail?.customerphone)}
                  className="bg-gray-200 rounded-xl h-12 w-12 items-center justify-center"
                  disabled={true}
                >
                  <Phone size={20} color="#9CA3AF" />
                </Button>
                <Button
                  variant="solid"
                  onPress={toChatScreen}
                  className="bg-gray-200 rounded-xl h-12 w-12 items-center justify-center"
                  disabled={true}
                >
                  <MessageSquare size={20} color="#9CA3AF" />
                </Button>
              </Box>
            </Box>
            <Box className="flex-row items-center p-3 bg-[#1a3148]/5 rounded-xl">
              <Text className="text-xs uppercase tracking-wider text-gray-500">Dịch vụ:</Text>
              <Text className="text-base font-semibold text-[#1a3148] ml-2">
                {requestDetail?.servicepackagename}
              </Text>
              <Text className="text-sm text-gray-400 mx-2">•</Text>
              <Text className="text-base font-semibold text-[#fab753]">
                {requestDetail?.requesttype}
              </Text>
            </Box>
          </Box>

          <Box className="bg-[#f8fafc] rounded-2xl p-5 space-y-4">
            <Text className="text-base font-semibold text-[#1a3148] mb-2">
              Chi tiết
            </Text>
            <Box className="flex-row items-center w-full">
              <Box className="w-11 h-11 bg-[#1a3148]/5 rounded-xl items-center justify-center">
                <MapPin size={20} color="#1a3148" />
              </Box>
              <Box className="ml-3 flex-1">
                <Text className="text-xs uppercase tracking-wider text-gray-500">Điểm đón</Text>
                <Text className="text-base font-medium text-[#1a3148]">
                  {requestDetail?.pickuplocation}
                </Text>
              </Box>
            </Box>

            {requestDetail?.destination && (
              <Box className="flex-row items-center w-full">
                <Box className="w-11 h-11 bg-[#fab753]/10 rounded-xl items-center justify-center">
                  <MapPinCheckInsideIcon size={20} color="#fab753" />
                </Box>
                <Box className="ml-3 flex-1">
                  <Text className="text-xs uppercase tracking-wider text-gray-500">Đích đến</Text>
                  <Text className="text-base font-medium text-[#1a3148]">
                    {requestDetail?.destination}
                  </Text>
                </Box>
              </Box>
            )}
          </Box>

          <Box className="bg-[#f8fafc] rounded-2xl p-5">
            <Text className="text-base font-semibold text-[#1a3148] mb-4">
              Phương thức thanh toán
            </Text>
            <Box className="flex-row items-center justify-between">
              <Box>
                <Box className="flex-row items-center mb-1.5">
                  <CreditCard size={18} color="#1a3148" />
                  <Text className="text-xs uppercase tracking-wider text-gray-500 ml-2">Tổng</Text>
                </Box>
                <Text className="text-xl font-bold text-[#1a3148]">
                  {formatMoney(requestDetail?.totalprice)}
                </Text>
              </Box>
              <Box className="bg-black px-4 py-2 rounded-xl">
                <Text className="text-white font-bold text-sm">
                  {requestDetail?.paymentmethod}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="px-4 pb-6 pt-2 border-t border-gray-100">
        <Button
          className="h-14 rounded-xl bg-green-500/90 active:opacity-80 shadow-sm"
          disabled={true}
        >
          <Text className="font-bold text-lg text-white">
            {changeButtonTitle()}
          </Text>
        </Button>
      </Box>
      {/* <Box className="relative">
        {requestDetail?.requestid &&
          <UnpaidPaymentList requestId={requestDetail?.requestid} />
        }
      </Box> */}
    </ScrollView>
  );
};

export default DriverRequestDetail;