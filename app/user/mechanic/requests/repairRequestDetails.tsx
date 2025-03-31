import AuthContext from "@/app/context/AuthContext";
import LoadingScreen from "@/app/loading/loading";
import { createRepairQuote, getRepairCostPreview, getRepairQuotesByRequestDetailId, getRepairRequestDetailForMechanic, updatePaymentStatus, updateRepairRequestStatus } from "@/app/services/beAPI";
import { usePubNubService } from "@/app/services/pubnubService";
import { decodedToken, formatMoney, handlePhoneCall } from "@/app/utils/utils";
import { GoBackButton } from "@/components/custom/GoBackButton";
import { RepairStatusBadge } from "@/components/custom/MechanicStatusBadge";
import RepairCostPreviewSelect from "@/components/custom/RepairCostPreviewSelect";
import { CustomerInfo } from "@/components/custom/RepairCustomerInfo";
import { VehicleInfoBox } from "@/components/custom/VehicleInfoBox";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
interface RepairRequestDetail {
  requestid: string,
  requesttype: string,
  requestdetailid: string,
  requeststatus: string,
  totalprice: number | null,
  stationid: string,
  stationname: string,
  stationaddress: string,
  customerid: string,
  customername: string,
  customerphone: string,
  customeravatar: string,
  vehicleid: string,
  licenseplate: string,
  vehiclephoto: string,
  vehiclecondition: string,
  paymentmethod: string,
  paymentstatus: string,
}
interface RepairCostPreview {
  id: string,
  name: string;
  description: string,
  min: number;
  max: number;
}

interface RepairQuote {
  id?: string;
  index: number;
  repairname?: string;
  detail: string;
  cost: number;
  requestdetailid: string;
  repaircostpreviewid: number;
  createddate?: string;
  updateddate?: string;
  min?: number,
  max?: number
}

export default function RepairDetailsScreen() {
  const { token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  const { createDirectChannel } = usePubNubService();
  const { requestDetailId, requestId } = useLocalSearchParams<{ requestDetailId: string, requestId: string }>();
  const [repairCostPreviews, setRepairCostPreviews] = useState<RepairCostPreview[]>([]);
  const [repairRequestDetail, setRepairRequestDetail] = useState<RepairRequestDetail>();
  const [repairQuotes, setRepairQuotes] = useState<RepairQuote[]>([
    { index: 1, detail: "", cost: 0, requestdetailid: requestDetailId, repaircostpreviewid: 0 },
  ]);
  const [isNew, setIsNew] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fetchRepairRequestDetail = async () => {
    try {
      const results = await getRepairRequestDetailForMechanic(token, requestId);
      setRepairRequestDetail(results);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  }
  const fetchRepairCostPreview = async () => {
    try {
      const results = await getRepairCostPreview();
      setRepairCostPreviews(results);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  }
  const fetchRepairQuotes = async () => {
    try {
      const results = await getRepairQuotesByRequestDetailId(requestDetailId);

      if (results && results.length > 0) {
        // Add an index field to each element based on its position
        const updatedResults = results.map((quote: any, idx: number) => ({
          ...quote,
          index: idx + 1, // Ensure index starts from 1
        }));
        setIsNew(false);
        setRepairQuotes(updatedResults);
      } else {
        // If no repair quotes exist, initialize a new one
        setRepairQuotes([{ index: 1, detail: "", cost: 0, requestdetailid: requestDetailId, repaircostpreviewid: 0 }]);
      }
      setIsLoading(false)
      console.log("Fetched repair quotes:", results);
    } catch (error) {
      console.error("Error fetching repair quotes:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRepairRequestDetail();
    }, 7000);
    return () => clearInterval(interval);
  }, [requestDetailId]);

  useEffect(() => {
    fetchRepairRequestDetail();
    fetchRepairCostPreview()
    fetchRepairQuotes()
  }, [])

  const addRepairItem = () => {
    setRepairQuotes((prev) => {
      const lastIndex = prev.length > 0 ? prev[prev.length - 1].index : 0; // Get the last item's index
      return [
        ...prev,
        {
          index: lastIndex + 1,
          repairname: "",
          detail: "",
          cost: 0,
          requestdetailid: requestDetailId,
          repaircostpreviewid: 0,
        },
      ];
    });
  };

  const removeRepairItem = (index: number) => {
    setRepairQuotes((prev) => prev.filter((item) => item.index !== index));
  };

  const isAddDisabled = repairQuotes.some(
    (item) => item.cost === 0 || !item.repairname
  );
  const isSubmitDisabled = repairQuotes.some(
    (item) => item.min !== undefined && item.max !== undefined &&
      (item.cost < item.min || item.cost > item.max)
      || !item.repairname
  );

  const handleRepairSelection = (index: number, selectedRepair: RepairCostPreview) => {
    setRepairQuotes((prev) =>
      prev.map((item) =>
        item.index === index
          ? {
            ...item,
            repairname: selectedRepair.name,
            repaircostpreviewid: parseInt(selectedRepair.id),
            min: selectedRepair.min,
            max: selectedRepair.max,
          }
          : item
      )
    );
  };

  const handlePriceChange = (index: number, costStr: string) => {
    const parsedCost = costStr === "" ? 0 : parseInt(costStr) || 0;
    setRepairQuotes((prev) =>
      prev.map((item) =>
        item.index === index ? { ...item, cost: parsedCost } : item
      )
    );
  };

  const handleConfirmSend = () => {
    Alert.alert(
      "Xác nhận gửi báo giá",
      "Bạn có chắc chắn muốn gửi báo giá?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xác nhận", onPress: handleSendRepairQuote }
      ]
    );
  };

  const sendRepairQuote = async (repairQuote: RepairQuote) => {
    const { detail, cost, requestdetailid, repaircostpreviewid } = repairQuote;
    const payload = { detail, cost, requestdetailid, repaircostpreviewid };

    // Remove try-catch to let errors propagate
    const results = await createRepairQuote(payload, token);
    console.log(results);
    return results;
  };

  const handleSendRepairQuote = async () => {
    try {
      await Promise.all(repairQuotes.map(sendRepairQuote));
      await updateRepairRequestStatus(requestDetailId, token, 'Waiting')
      Alert.alert("Thành công", "Báo giá đã được gửi!");
      setIsNew(false)
      if (repairRequestDetail)
        createDirectChannel(repairRequestDetail.customerid, requestDetailId)
    } catch (error) {
      console.error("Error sending repair quotes:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi gửi báo giá.");
    }
  };

  const handleUpdateRepairStatus = async () => {
    const requestStatus = repairRequestDetail?.requeststatus;
    switch (requestStatus) {
      case "Accepted":
        await updateRepairRequestStatus(requestDetailId, token, 'Repairing')
        console.log('Status updated to Repairing')
        break;
      case "Repairing":
        await updateRepairRequestStatus(requestDetailId, token, 'Done')
        console.log('Status updated to Done & Changed the status of return request to Pending')
        break;
      default:
        break;

    }
    fetchRepairRequestDetail();
  }

  const toChatScreen = () => {
    router.push({
      pathname: "/user/mechanic/requests/chatScreen",
      params: {
        currentUserId: userId,
        requestDetailId: requestDetailId
      }
    });
  }
  const onCallPress = () => {
    handlePhoneCall(repairRequestDetail?.customerphone);
  }

  const renderPaymentStatus = (paymentstatus: string | undefined) => {
    let paymentStatusText = "";
    let bgColor = "";

    switch (paymentstatus) {
      case "Unpaid":
        paymentStatusText = "Chưa thanh toán";
        bgColor = "bg-red-100 text-red-600"; // Light red background for unpaid
        break;
      case "Success":
        paymentStatusText = "Đã thanh toán";
        bgColor = "bg-green-100 text-green-600"; // Light green background for success
        break;
      default:
        paymentStatusText = "UNKNOWN";
        bgColor = "bg-gray-100 text-gray-600"; // Gray background for unknown
        break;
    }
    return (
      <Text className={`p-5 rounded-md font-semibold ${bgColor}`}>
        {paymentStatusText}
      </Text>
    );
  };

  const changePaymentStatus = async (newStatus: string) => {
    if (repairRequestDetail) {

      const payload = {
        requestDetailId: repairRequestDetail?.requestdetailid,
        newStatus
      }
      const result = await updatePaymentStatus(payload, token)
      if (result) fetchRepairRequestDetail();
    }
  }

  if (isLoading) return <LoadingScreen />
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <ScrollView className="flex-1">
        <Box className="flex-1 p-5">
          <GoBackButton />
          <Text className="text-lg font-bold text-center mb-2">Chi tiết sửa xe:</Text>
          <CustomerInfo repairRequestDetail={repairRequestDetail} onCallPress={onCallPress} toChatScreen={toChatScreen} />
          {repairRequestDetail && <RepairStatusBadge status={repairRequestDetail?.requeststatus} />}

          <VehicleInfoBox repairRequestDetail={repairRequestDetail} />

          <Box className="border border-gray-300 rounded-lg p-3 my-3">
            <Text className="font-bold">Bảng báo giá:</Text>
            <FlatList
              scrollEnabled={false}
              data={repairQuotes}
              keyExtractor={(item) => item?.index.toString()}
              renderItem={({ item, index }) => {
                return (
                  <Box className="p-4 border border-gray-300 rounded-xl my-2 bg-white shadow-md">
                    <Box className="mb-2">
                      {isNew ? (
                        <RepairCostPreviewSelect
                          repairOptions={repairCostPreviews.filter(
                            (repair) => !repairQuotes.some((quote) => quote.repairname === repair.name)
                          )}
                          selectedRepair={item.detail}
                          onSelectRepair={(repair) => handleRepairSelection(item.index, repair)}
                        />
                      ) : (
                        <Text className="text-base font-semibold text-gray-800">{item.repairname || "No repair name found"}</Text>
                      )}
                    </Box>

                    {isNew ? (
                      <Box className="flex-row items-center">
                        <TextInput
                          className={`flex-1 border p-3 rounded-md text-base mr-3 transition-all duration-200 ${item.min && item.max && (item.cost < item.min || item.cost > item.max) ? 'border-red-500 border-2' : 'border-gray-300'
                            }`}
                          placeholder="Nhập giá"
                          keyboardType="numeric"
                          value={item.cost === 0 ? "" : item.cost.toString()}
                          onChangeText={(text) => handlePriceChange(item.index, text)}
                        />
                        {repairQuotes.length > 1 && (
                          <TouchableOpacity className="bg-red-500 px-4 py-2 rounded-full shadow-md active:opacity-75" onPress={() => removeRepairItem(item.index)}>
                            <Text className="text-white font-bold">X</Text>
                          </TouchableOpacity>
                        )}
                      </Box>
                    ) : (
                      <Text className="text-lg font-semibold text-green-600">{formatMoney(item.cost)}</Text>
                    )}
                  </Box>
                );
              }}
            />

            {isNew && (
              <Box className="items-center">
                <TouchableOpacity className={`rounded-full py-3 px-5 m-5 
                  ${isAddDisabled ? 'bg-gray-400 opacity-50' :
                    'bg-green-300'}`} onPress={addRepairItem} disabled={isAddDisabled}>
                  <Text className="text-xl">+</Text>
                </TouchableOpacity>

                {repairQuotes.length > 0 && (
                  <Button size="lg"
                    onPress={handleConfirmSend}
                    isDisabled={isSubmitDisabled} // ✅ Gluestack uses "isDisabled" instead of "disabled"
                    className={isSubmitDisabled ? "bg-gray-400 opacity-50" : "bg-blue-500"}
                  >
                    <ButtonText className="font-extrabold text-sm text-white">
                      Gửi báo giá
                    </ButtonText>
                  </Button>
                )}
              </Box>
            )}
            {repairRequestDetail?.paymentmethod &&
              (
                <>
                  <Text className="text-green-600 font-semibold">
                    💰 Tổng tiền: {repairRequestDetail?.totalprice?.toLocaleString()} VND
                  </Text>
                  <Text className="text-green-600 font-semibold">
                    💰 Phương thức thanh toán: {repairRequestDetail?.paymentmethod}
                  </Text>
                  <Text className="text-green-600 font-semibold">
                    💰 Trạng thái thanh toán: {renderPaymentStatus(repairRequestDetail?.paymentstatus)}
                  </Text>
                </>
              )}
          </Box>

          <Box className="items-center mt-5">
            {repairRequestDetail
              && repairRequestDetail?.requeststatus !== "Inspecting"
              && repairRequestDetail?.requeststatus !== "Done"
              && (
                <Button size="lg"
                  onPress={handleUpdateRepairStatus}
                  isDisabled={!['Accepted', 'Repairing'].includes(repairRequestDetail.requeststatus)}
                  className={`rounded-lg font-extrabold ${['Accepted', 'Repairing'].includes(repairRequestDetail.requeststatus)
                    ? 'bg-green-500'
                    : 'bg-gray-400 opacity-50'
                    }`}
                >
                  <ButtonText className="text-white text-sm">
                    {repairRequestDetail?.requeststatus === 'Repairing' ? "Hoàn tất sửa chữa" : "Bắt đầu sửa xe"}
                  </ButtonText>
                </Button>
              )}
            {(repairRequestDetail?.paymentstatus === 'Unpaid'
              && repairRequestDetail?.paymentmethod === 'Tiền mặt')
              && (repairRequestDetail?.requeststatus === 'Repairing'
                || repairRequestDetail?.requeststatus === 'Done')
              &&
              <Button
                className="bg-orange-500 mt-5 w-auto p-2 rounded"
                size="lg"
                disabled={repairRequestDetail?.requeststatus !== 'Done'}
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
                        onPress: () => changePaymentStatus("Success"),
                      },
                    ]
                  );
                }}
              >
                <Text className="text-white text-center">Xác nhận thanh toán</Text>
              </Button>
            }
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}