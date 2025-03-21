import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { ScrollView, Image, Linking, Alert } from "react-native";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { MapPin, Clock, AlertCircle, Phone, CreditCard, MessageSquare, ChevronLeft } from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";
import { getStatusColor } from "@/components/custom/StatusBadge";
import { formatDate } from "@/app/utils/utils";
import { handlePhoneCall, decodedToken } from "@/app/utils/utils";

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
  licenseplate: string | null;
  brandname: string | null;
  vehicletype: string | null;
  vehiclestatus: string | null;
}

const LoadingSkeleton = () => (
  <Box className="flex-1 bg-gray-50">
    <ScrollView>
      <Box className="bg-blue-600 px-4 pt-12">
        <Box className="w-8 h-8 bg-white/20 rounded-lg animate-pulse" />
      </Box>

      <Box className="bg-blue-600 px-4 pb-6 rounded-b-[32px]">
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

              <Box className="flex-row items-center">
                <Box className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                <Box className="ml-3">
                  <Box className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                  <Box className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </Box>
              </Box>

              <Box className="flex-row items-center">
                <Box className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                <Box className="ml-3">
                  <Box className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                  <Box className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <Box className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <Box className="space-y-4">
            <Box className="flex-row items-center">
              <Box className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
              <Box className="ml-3">
                <Box className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                <Box className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
              </Box>
            </Box>

            <Box className="flex-row items-center">
              <Box className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
              <Box className="ml-3">
                <Box className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                <Box className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              </Box>
            </Box>

            <Box className="flex-row items-center">
              <Box className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
              <Box className="ml-3">
                <Box className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                <Box className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
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
  const { requestdetailid } = useLocalSearchParams<{ requestdetailid: string }>();
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackImage, setFallbackImage] = useState(false);
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

  const handleCallDriver = useCallback(() => {
    if (requestDetail?.driverphone) {
      Linking.openURL(`tel:${requestDetail.driverphone}`);
    }
  }, [requestDetail?.driverphone]);

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
      }
    });
  }, [requestDetail, token]);

  const handleImageError = () => {
    // Fallback to default avatar
    setFallbackImage(true);
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Box className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-red-600 text-center mb-4">{error}</Text>
        <Pressable 
          onPress={fetchRequestDetail}
          className="bg-blue-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </Pressable>
      </Box>
    );
  }

  if (!requestDetail) {
    return (
      <Box className="flex-1 bg-gray-50 items-center justify-center">
        <Text>Request not found</Text>
      </Box>
    );
  }

  const statusColorClass = getStatusColor(requestDetail.requeststatus);

  return (
    <Box className="flex-1 bg-gray-50">
      <ScrollView>
        <Box className="bg-blue-600 px-4 pt-6">
          <Box className="mb-2">
            <Pressable
              onPress={() => router.back()}
              className="w-8 h-8 items-center justify-center bg-white/20 rounded-lg"
            >
              <ChevronLeft color="white" size={24} />
            </Pressable>
          </Box>
        </Box>

        <Box className="bg-blue-600 px-4 pb-6 rounded-b-[32px]">
          <Box className="mt-4">
            <Text className="text-white text-2xl font-bold mb-3">
              Request Details
            </Text>
            <Box className="flex-row items-center space-x-3 mb-2">
              <Text className="text-blue-100 text-lg font-semibold">
                {requestDetail.servicepackagename}
              </Text>
            </Box>
          </Box>
        </Box>

        <Box className="px-4 -mt-6">
          {requestDetail.drivername && (
            <Box className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
              <Box className={`w-full py-2 ${statusColorClass}`}>
                <Text className="text-center font-medium">
                  {requestDetail.requeststatus}
                </Text>
              </Box>
              <Box className="p-4">
                <Box className="space-y-4">
                  <Box className="flex-row items-center">
                    <Box className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100">
                      <Image
                        source={{
                          uri: fallbackImage ? "https://example.com/default-avatar.png" : "https://pbs.twimg.com/media/GEXDdESbIAAd5Qt?format=jpg&name=large",
                        }}
                        className="w-full h-full"
                        resizeMode="cover"
                        onError={handleImageError}
                      />
                    </Box>
                    <Box className="ml-4 flex-1">
                      <Text className="text-lg font-semibold text-gray-900">{requestDetail.drivername}</Text>
                      <Text className="text-base text-gray-600 mt-1">
                        {requestDetail.brandname} • {requestDetail.licenseplate}
                      </Text>
                    </Box>
                  </Box>

                  <Box className="flex-row space-x-3 mt-2 pt-4 border-t border-gray-100">
                    <Pressable
                      onPress={handleCall}
                      className="flex-1 flex-row items-center justify-center bg-blue-50 p-3 rounded-xl active:opacity-80"
                    >
                      <Phone size={20} color="#3B82F6" />
                      <Text className="ml-2 text-blue-600 font-medium">Call Driver</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={handleChat}
                      className="flex-1 flex-row items-center justify-center bg-green-50 p-3 rounded-xl active:opacity-80"
                    >
                      <MessageSquare size={20} color="#059669" />
                      <Text className="ml-2 text-green-600 font-medium">Chat</Text>
                    </Pressable>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          <Box className="bg-white rounded-2xl shadow-sm mb-4">
            <Box className="p-4">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Service Information
              </Text>
              <Box className="space-y-4">
                <Box className="flex-row items-center">
                  <MapPin size={20} color="#6B7280" />
                  <Box className="ml-3 flex-1">
                    <Text className="text-sm text-gray-500">Pickup Location</Text>
                    <Text className="text-base text-gray-900">{requestDetail.pickuplocation}</Text>
                  </Box>
                </Box>

                {requestDetail.destination && (
                  <Box className="flex-row items-center">
                    <AlertCircle size={20} color="#6B7280" />
                    <Box className="ml-3 flex-1">
                      <Text className="text-sm text-gray-500">Destination</Text>
                      <Text className="text-base text-gray-900">{requestDetail.destination}</Text>
                    </Box>
                  </Box>
                )}

                <Box className="flex-row items-center">
                  <Clock size={20} color="#6B7280" />
                  <Box className="ml-3">
                    <Text className="text-sm text-gray-500">Created At</Text>
                    <Text className="text-base text-gray-900">
                      {formatDate(requestDetail.createddate)}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box className="bg-white rounded-2xl shadow-sm mb-4">
            <Box className="p-4">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Payment Information
              </Text>
              <Box className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl">
                <Box>
                  <Text className="text-sm text-gray-500">Total Price</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {requestDetail.totalprice.toLocaleString('vi-VN')} VND
                  </Text>
                </Box>
                <CreditCard size={24} color="#6B7280" />
              </Box>
            </Box>
          </Box>
        </Box>
      </ScrollView>
    </Box>
  );
}