import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { ScrollView, Image, Linking, Alert } from "react-native";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import {
  MapPin,
  Clock,
  AlertCircle,
  Phone,
  CreditCard,
  MessageSquare,
  Navigation2,
  Settings,
  Wrench,
  DollarSign,
} from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";
import { getStatusColor } from "@/components/custom/StatusBadge";
import { formatDate, formatMoney } from "@/app/utils/utils";
import { handlePhoneCall, decodedToken } from "@/app/utils/utils";
import { GoBackButton } from "@/components/custom/GoBackButton";
import { Avatar } from "react-native-elements";
import { RepairQuote } from "@/app/context/formFields";

interface RequestDetail {
  customername: string;
  customerphone: string;
  requesttype: string;
  requestdetailid: string;
  pickuplong: string;
  pickuplat: string;
  deslng: string;
  deslat: string;
  note: string | null;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  createddate: string;
  requeststatus: string;
  requestid: string;
  staffid: string | null;
  estimatedtime: string | null;
  servicepackagename: string;
  drivername: string | null;
  driverphone: string | null;
  driverimage: string | null;
  licenseplate: string | null;
  brandname: string | null;
  vehicletype: string | null;
  vehiclestatus: string | null;
  paymentmethod: string | null;
  paymentstatus?: string | null;
  zptransid?: string | null;
}

const LoadingSkeleton = () => (
  <Box className="flex-1 bg-[#f1f5f9]">
    <ScrollView>
      <Box className="bg-[#1a3148] px-4 pt-12">
        <Box className="w-8 h-8 bg-white/20 rounded-lg animate-pulse" />
      </Box>

      <Box className="bg-[#1a3148] px-4 pb-6 rounded-b-[32px]">
        <Box className="mt-4">
          <Box className="h-8 w-48 bg-white/20 rounded-lg animate-pulse mb-3" />
          <Box className="h-6 w-36 bg-white/10 rounded-lg animate-pulse mb-2" />
        </Box>
      </Box>

      <Box className="px-4 -mt-6">
        <Box className="bg-white rounded-2xl shadow-sm mb-4">
          <Box className="h-8 w-full bg-gray-100 animate-pulse" />
          <Box className="p-4">
            <Box className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
            <Box className="space-y-4">
              <Box className="flex-row items-center">
                <Box className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                <Box className="ml-3 flex-1">
                  <Box className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                  <Box className="h-5 w-full bg-gray-200 rounded animate-pulse" />
                </Box>
              </Box>

              <Box className="flex-row items-center">
                <Box className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                <Box className="ml-3 flex-1">
                  <Box className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                  <Box className="h-5 w-full bg-gray-200 rounded animate-pulse" />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </ScrollView>
  </Box>
);

export default function RequestDetailsScreen() {
  const { token } = useContext(AuthContext);
  const { requestdetailid } = useLocalSearchParams<{
    requestdetailid: string;
  }>();
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackImage, setFallbackImage] = useState(false);
  const [repairQuotes, setRepairQuotes] = useState<RepairQuote[]>([]);
  const [repairQuotesLoading, setRepairQuotesLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchRequestDetail = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://motor-save-be.vercel.app/api/v1/requests/driver/${requestdetailid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequestDetail(response.data);
    } catch (error) {
      console.error("Error fetching request details:", error);
      setError("Failed to load request details");
    } finally {
      setLoading(false);
    }
  }, [requestdetailid, token]);

  const fetchRepairQuotes = useCallback(async () => {
    if (
      !requestDetail?.requestdetailid ||
      requestDetail?.requesttype !== "Sửa xe"
    )
      return;

    setRepairQuotesLoading(true);
    try {
      const response = await axios.get<RepairQuote[]>(
        `https://motor-save-be.vercel.app/api/v1/repairquotes/requestdetail/${requestDetail.requestdetailid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRepairQuotes(response.data);
    } catch (error) {
      console.error("Error fetching repair quotes:", error);
    } finally {
      setRepairQuotesLoading(false); // Set loading state to false after fetching
    }
  }, [requestDetail?.requestdetailid, requestDetail?.requesttype, token]);

  // const handleCallDriver = useCallback(() => {
  //   if (requestDetail?.driverphone) {
  //     Linking.openURL(`tel:${requestDetail.driverphone}`);
  //   }
  // }, [requestDetail?.driverphone]);

  const handleCall = useCallback(() => {
    if (requestDetail?.driverphone) {
      handlePhoneCall(requestDetail.driverphone);
    } else {
      Alert.alert("Error", "Driver phone number not available");
    }
  }, [requestDetail?.driverphone]);

  const handleChat = useCallback(() => {
    router.push({
      pathname: "/user/customer/home/chatScreen",
      params: {
        currentUserId: decodedToken(token)?.id,
        staffId: requestDetail?.staffid,
        requestDetailId: requestDetail?.requestdetailid,
      },
    });
  }, [requestDetail, token]);

  const handleImageError = () => {
    // Fallback to default avatar
    setFallbackImage(true);
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  useEffect(() => {
    if (requestDetail && requestDetail.requesttype === "Sửa xe") {
      fetchRepairQuotes();
    }
  }, [fetchRepairQuotes, requestDetail]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Box className="flex-1 bg-[#f1f5f9] items-center justify-center p-4">
        <Box className="flex-row items-center bg-red-50 p-4 rounded-xl mb-4 border border-red-100">
          <AlertCircle size={24} color="#ef4444" />
          <Text className="text-red-600 ml-3">{error}</Text>
        </Box>
        <Pressable
          onPress={fetchRequestDetail}
          className="bg-[#1a3148] px-4 py-3 rounded-xl"
        >
          <Text className="text-white font-medium">Retry</Text>
        </Pressable>
      </Box>
    );
  }

  if (!requestDetail) {
    return (
      <Box className="flex-1 bg-[#f1f5f9] items-center justify-center">
        <Text>Không có yêu cầu</Text>
      </Box>
    );
  }

  const statusColorClass = getStatusColor(requestDetail.requeststatus);
  const isRequestDone = requestDetail.requeststatus === "Done";

  return (
    <Box className="flex-1 bg-[#f1f5f9]">
      <GoBackButton />
      <ScrollView>
        <Box className="bg-[#1a3148] px-5 pt-14"></Box>

        <Box className="bg-[#1a3148] px-5 pb-6 rounded-b-[32px]">
          <Box className="mt-4">
            <Text className="text-white text-2xl font-bold mb-3">
              Chi tiết yêu cầu
            </Text>
            <Box className="flex-row items-center space-x-3 mb-2">
              <Text className="text-[#fab753] text-lg font-semibold">
                {requestDetail.servicepackagename}
              </Text>
            </Box>
          </Box>
        </Box>

        <Box className="px-4 -mt-6">
          <Box className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-gray-100/50">
            <Box className={`w-full py-2.5 ${statusColorClass}`}>
              <Text className="text-center font-semibold">
                {requestDetail.requeststatus}
              </Text>
            </Box>
          </Box>

          {requestDetail.drivername && (
            <Box className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-gray-100/50">
              <Box className="p-4">
                <Text className="text-lg font-semibold text-[#1a3148] mb-4">
                  {requestDetail.requesttype === "Sửa xe"
                    ? "Thợ sửa"
                    : "Tài xế"}
                </Text>
                <Box className="space-y-4">
                  <Box className="flex-row items-center">
                    <Box className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100">
                      <Avatar
                        size={52}
                        rounded
                        source={{
                          uri:
                            requestDetail?.driverimage ||
                            "https://example.com/default-avatar.png",
                        }}
                        containerStyle={{
                          borderWidth: 2,
                          borderColor: "white",
                        }}
                      />
                    </Box>
                    <Box className="ml-4 flex-1">
                      <Text className="text-lg font-semibold text-[#1a3148]">
                        {requestDetail.drivername}
                      </Text>
                      <Text className="text-base text-gray-600 mt-1">
                        {requestDetail.brandname} • {requestDetail.licenseplate}
                      </Text>
                    </Box>
                  </Box>

                  <Box className="flex-row space-x-3 mt-2 pt-4 border-t border-gray-100">
                    <Pressable
                      onPress={handleCall}
                      className={`flex-1 flex-row items-center justify-center bg-[#1a3148]/5 p-3 rounded-xl active:opacity-80 ${isRequestDone ? "opacity-50" : ""}`}
                      disabled={isRequestDone}
                    >
                      <Phone size={20} color="#1a3148" />
                      <Text className="ml-2 text-[#1a3148] font-medium">
                        Gọi
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleChat}
                      className={`flex-1 flex-row items-center justify-center bg-[#fab753]/10 p-3 rounded-xl active:opacity-80 ${isRequestDone ? "opacity-50" : ""}`}
                      disabled={isRequestDone}
                    >
                      <MessageSquare size={20} color="#fab753" />
                      <Text className="ml-2 text-[#fab753] font-medium">
                        Nhắn tin
                      </Text>
                    </Pressable>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          <Box className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-100/50">
            <Box className="p-4">
              {/* <Text className="text-lg font-semibold text-[#1a3148] mb-4">
                Thông tin dịch vụ
              </Text> */}
              <Box className="space-y-4">
                {requestDetail.requesttype !== "Sửa xe" && (
                  <Box className="flex-row items-center">
                    <Box className="w-10 h-10 rounded-xl bg-[#1a3148]/5 items-center justify-center">
                      <MapPin size={20} color="#1a3148" />
                    </Box>
                    <Box className="ml-3 flex-1">
                      <Text className="text-sm text-gray-500">Điểm đón</Text>
                      <Text className="text-base text-[#1a3148]">
                        {requestDetail.pickuplocation}
                      </Text>
                    </Box>
                  </Box>
                )}

                {requestDetail.destination && (
                  <Box className="flex-row items-center">
                    <Box className="w-10 h-10 rounded-xl bg-[#fab753]/10 items-center justify-center">
                      <Navigation2 size={20} color="#fab753" />
                    </Box>
                    <Box className="ml-3 flex-1">
                      <Text className="text-sm text-gray-500">Đích đến</Text>
                      <Text className="text-base text-[#1a3148]">
                        {requestDetail.destination}
                      </Text>
                    </Box>
                  </Box>
                )}

                {requestDetail.requesttype === "Sửa xe" && (
                  <Box className="flex-row items-center">
                    <Box className="w-10 h-10 rounded-xl bg-[#1a3148]/10 items-center justify-center">
                      <Wrench size={20} color="#1a3148" />
                    </Box>
                    <Box className="ml-2 flex-1">
                      <Text className="text-sm text-gray-500">
                        Loại dịch vụ sửa chữa
                      </Text>
                      <Box className="mt-1">
                        {repairQuotesLoading ? (
                          <Box className="bg-[#f8fafc] rounded-lg p-2">
                            <Box className="flex-row justify-between items-center mb-2">
                              <Box className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
                              <Box className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                            </Box>
                            <Box className="flex-row justify-between items-center">
                              <Box className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                              <Box className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                            </Box>
                          </Box>
                        ) : repairQuotes.filter(
                          (quote) => quote.repairpackagename === "Basic"
                        ).length > 0 ? (
                          <Box className="bg-[#f8fafc] rounded-lg p-2">
                            {repairQuotes
                              .filter(
                                (quote) => quote.repairpackagename === "Basic"
                              )
                              .map((item, index) => (
                                <Box
                                  key={index}
                                  className="flex-row justify-between items-center mb-1 last:mb-0"
                                >
                                  <Text className="text-base text-[#1a3148] flex-1">
                                    {item.repairname}
                                  </Text>
                                  <Text className="text-base font-medium text-[#1a3148]">
                                    {formatMoney(
                                      item.repairpackagename === "Basic"
                                        ? item.wage || 0
                                        : item.cost
                                    )}
                                  </Text>
                                </Box>
                              ))}
                          </Box>
                        ) : (
                          <Text className="text-base text-[#1a3148]">
                            Chưa có thông tin
                          </Text>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}

                {requestDetail.requesttype === "Sửa xe" && (
                  <Box className="flex-row items-center">
                    <Box className="w-10 h-10 rounded-xl bg-[#1a3148]/5 items-center justify-center">
                      <Settings size={20} color="#1a3148" />
                    </Box>
                    <Box className="ml-2 flex-1">
                      <Text className="text-sm text-gray-500">
                        Linh kiện thay thế
                      </Text>
                      <Box className="mt-1">
                        {repairQuotesLoading ? (
                          <Box className="bg-[#f8fafc] rounded-lg p-2">
                            <Box className="mb-2">
                              <Box className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                              <Box className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                              <Box className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                            </Box>
                            <Box>
                              <Box className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-1" />
                              <Box className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                            </Box>
                          </Box>
                        ) : repairQuotes.filter(
                          (quote) => quote.repairpackagename === "Addons"
                        ).length > 0 ? (
                          <Box className="bg-[#f8fafc] rounded-lg p-2">
                            {repairQuotes
                              .filter(
                                (quote) => quote.repairpackagename === "Addons"
                              )
                              .map((item, index) => (
                                <Box
                                  key={index}
                                  className="flex-row justify-between items-center mb-1 last:mb-0"
                                >
                                  <Box className="flex-1">
                                    <Text className="text-base text-[#1a3148]">
                                      {item.accessoryname || item.repairname}
                                    </Text>
                                    {item.partcategoryname && (
                                      <Text className="text-xs text-gray-500">
                                        {item.partcategoryname}
                                      </Text>
                                    )}
                                    <Text className="text-xs">
                                      Phụ thu: {formatMoney(item.wage)}
                                    </Text>
                                  </Box>
                                  <Text className="text-base font-medium text-[#1a3148]">
                                    {formatMoney(item.cost)}
                                  </Text>
                                </Box>
                              ))}
                          </Box>
                        ) : (
                          <Text className="text-base text-[#1a3148]">
                            Không có linh kiện
                          </Text>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}

                {requestDetail.requesttype === "Sửa xe" &&
                  repairQuotes.length > 0 && (
                    <Box className="flex-row items-center">
                      <Box className="w-10 h-10 rounded-xl bg-[#1a3148]/5 items-center justify-center">
                        <DollarSign size={20} color="#1a3148" />
                      </Box>
                      <Box className=" ml-2 flex-1">
                        <Text className="text-sm text-gray-500">
                          Tổng phụ thu
                        </Text>
                        <Box className="mt-1">
                          {repairQuotesLoading ? (
                            <Box className="bg-[#f8fafc] rounded-lg p-2">
                              <Box className="flex-row justify-between items-center mb-2">
                                <Box className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
                                <Box className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                              </Box>
                              <Box className="flex-row justify-between items-center">
                                <Box className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                                <Box className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                              </Box>
                            </Box>
                          ) : repairQuotes.length > 0 ? (
                            <Box className="bg-[#f8fafc] rounded-lg p-2">
                              <Box className="flex-row justify-between items-center mb-1 last:mb-0">
                                <Box className="flex-1">
                                  <Text className="text-base text-[#1a3148]">
                                    Phụ thu linh kiện & công
                                  </Text>
                                </Box>
                                <Text className="text-base font-medium text-[#1a3148]">
                                  {formatMoney(
                                    repairQuotes
                                      .filter(
                                        (quote) =>
                                          quote.repairpackagename !== "Basic"
                                      )
                                      .reduce(
                                        (sum, item) => sum + (item.wage || 0),
                                        0
                                      )
                                  )}
                                </Text>
                              </Box>
                            </Box>
                          ) : null}
                        </Box>
                      </Box>
                    </Box>
                  )}

                <Box className="flex-row items-center mt-1">
                  <Box className="w-10 h-10 rounded-xl bg-[#1a3148]/5 items-center justify-center">
                    <Clock size={20} color="#1a3148" />
                  </Box>
                  <Box className="ml-3">
                    <Text className="text-sm text-gray-500">Thời gian tạo</Text>
                    <Text className="text-base text-[#1a3148]">
                      {formatDate(requestDetail.createddate)}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-100/50">
            <Box className="p-4">
              {/* <Text className="text-lg font-semibold text-[#1a3148] mb-4">
                Phương thức thanh toán
              </Text> */}
              <Box className="w-full bg-[#f8fafc] rounded-xl p-4">
                <Box className="flex-row items-center justify-between">
                  <Box>
                    <Box className="flex-row items-center mb-1">
                      <CreditCard size={18} color="#1a3148" />
                      <Text className="text-sm text-gray-500 ml-2">Tổng</Text>
                    </Box>
                    {/* Error ngay toLocaleString() sua lai cho gia tri default 00000VND */}
                    <Text className="text-xl font-bold text-[#1a3148]">
                      {formatMoney(requestDetail.totalprice)}
                    </Text>
                    {requestDetail?.zptransid &&
                    <Box className="flex-col mb-1 mt-2">
                      <Text selectable={true} className="text-slate-600 font-bold">
                        Mã giao dịch
                      </Text>
                      <Text selectable={true} className="text-blue-600 font-bold">
                        {requestDetail?.zptransid}
                      </Text>
                    </Box>
                    }
                  </Box>
                  {requestDetail?.paymentmethod && (
                    <Box className="bg-black px-4 py-2 justify-center items-center rounded-lg">
                      <Text className="text-white font-bold">
                        {requestDetail.paymentmethod}
                      </Text>
                      <Text className="text-white font-bold">
                        ({requestDetail.paymentstatus})
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </ScrollView>
    </Box>
  );
}
