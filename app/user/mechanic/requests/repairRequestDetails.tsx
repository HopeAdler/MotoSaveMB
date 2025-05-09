import AuthContext from "@/app/context/AuthContext";
import { Accessory, RepairCostPreview } from "@/app/context/formFields";
import LoadingScreen from "@/app/loading/loading";
import {
  createPayment,
  createRepairQuote,
  getRepairCostPreview,
  getRepairQuotesByRequestDetailId,
  getRepairRequestDetailForMechanic,
  updatePaymentStatus,
  updateRepairRequestStatus,
} from "@/app/services/beAPI";
import { usePubNubService } from "@/app/services/pubnubService";
import { decodedToken, formatMoney, handlePhoneCall } from "@/app/utils/utils";
import { GoBackButton } from "@/components/custom/GoBackButton";
import { RepairStatusBadge } from "@/components/custom/MechanicStatusBadge";
// import PriceInput from "@/components/custom/PriceInput";
import RepairCostPreviewSelect from "@/components/custom/RepairCostPreviewSelect";
import { CustomerInfo } from "@/components/custom/RepairCustomerInfo";
import { VehicleInfoBox } from "@/components/custom/VehicleInfoBox";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { router, useLocalSearchParams } from "expo-router";
import { CreditCard } from "lucide-react-native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from "react-native";

interface RepairRequestDetail {
  requestid: string;
  receivername: string;
  receiverphone: string;
  requesttype: string;
  requestdetailid: string;
  requeststatus: string;
  totalprice: number;
  stationid: string;
  stationname: string;
  stationaddress: string;
  customerid: string;
  customername: string;
  customerphone: string;
  customeravatar: string;
  vehicleid: string;
  brandid: number;
  brandname: string;
  licenseplate: string;
  vehiclephoto: string;
  vehiclecondition: string;
  paymentmethod: string;
  paymentstatus: string;
}

interface RepairQuote {
  id?: string;
  index: number;
  requestdetailid: string;
  repairname?: string;
  wagerate?: number;
  accessoryname?: string;
  detail: string;
  cost: number;
  repaircostpreviewid: number;
  accessoryid: number | null;
  wage: number;
  total: number;
  createddate?: string;
  updateddate?: string;
}

// const translatePaymentMethod = (method: string | undefined): string => {
//   if (!method) return "";

//   switch (method) {
//     case "Tiền mặt": return "Cash";
//     default: return method;
//   }
// };

export default function RepairDetailsScreen() {
  const { token } = useContext(AuthContext);
  const userId = decodedToken(token)?.id;
  const { createDirectChannel } = usePubNubService();
  const { requestDetailId, requestId } = useLocalSearchParams<{
    requestDetailId: string;
    requestId: string;
  }>();
  const [repairCostPreviews, setRepairCostPreviews] = useState<
    RepairCostPreview[]
  >([]);
  const [repairRequestDetail, setRepairRequestDetail] =
    useState<RepairRequestDetail>();
  const [repairQuotes, setRepairQuotes] = useState<RepairQuote[]>([
    {
      index: 1,
      detail: "",
      cost: 0,
      requestdetailid: requestDetailId,
      repaircostpreviewid: 0,
      accessoryid: null,
      wage: 0,
      total: 0,
    },
  ]);
  const [isNew, setIsNew] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = async (isInitialFetch = false) => {
    try {
      if (isInitialFetch) setIsLoading(true);

      const results = await getRepairRequestDetailForMechanic(token, requestId);
      if (results) {
        setRepairRequestDetail(results);

        if (
          ["Waiting", "Accepted", "Repairing", "Done"].includes(
            results.requeststatus
          )
        ) {
          const quoteResults =
            await getRepairQuotesByRequestDetailId(requestDetailId);
          if (quoteResults?.length > 0) {
            setRepairQuotes(
              quoteResults.map((quote: any, idx: number) => ({
                ...quote,
                index: idx + 1,
              }))
            );
            setIsNew(false);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (isInitialFetch) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    if (repairRequestDetail?.requeststatus === "Inspecting") {
      createDirectChannel(repairRequestDetail.customerid, requestDetailId);
    }
    // Only poll if in Waiting status
    // if (repairRequestDetail?.requeststatus === "Waiting") {
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
    // }
  }, [requestDetailId, repairRequestDetail?.requeststatus]);

  useEffect(() => {
    const loadRepairCostPreviews = async () => {
      try {
        const previews = await getRepairCostPreview();
        setRepairCostPreviews(previews || []);
      } catch (error) {
        console.error("Error fetching repair cost previews:", error);
      }
    };
    loadRepairCostPreviews();
  }, []);

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
          accessoryid: null,
          wage: 0,
          total: 0,
        },
      ];
    });
  };

  const removeRepairItem = (index: number) => {
    setRepairQuotes((prev) => prev.filter((item) => item.index !== index));
  };

  const removeBasicItems = () => {
    setRepairQuotes((prev) => prev.filter((item) => item.wagerate !== 0));
  };

  const isAddDisabled = repairQuotes.some(
    (item) => item.total === 0 || !item.repairname
  );
  const isSubmitDisabled = repairQuotes.some(
    (item) => item.total === 0 || !item.repairname
  );

  // add the extra parameters here too
  const handleRepairSelection = (
    index: number,
    selectedRepair: RepairCostPreview,
    accessory?: Accessory,
    wage?: number,
    total?: number
  ) => {
    setRepairQuotes((prev) =>
      prev.map((item) =>
        item.index === index
          ? {
              ...item,
              repairname: selectedRepair.name,
              repaircostpreviewid: parseInt(selectedRepair.id),
              // min: selectedRepair.min,
              // max: selectedRepair.max,
              cost: accessory?.cost || 0,
              accessoryid: accessory?.id || null,
              wage: wage ?? selectedRepair.wage,
              total: total ?? selectedRepair.wage,
            }
          : item
      )
    );
  };

  // When the input loses focus, round the value and validate.
  // const handlePriceBlur = useCallback((index: number) => {
  //   setRepairQuotes((prev) =>
  //     prev.map((item) => {
  //       if (item.index === index) {
  //         // Round up to the next 1000 (e.g., 19500 or 19100 become 20000)
  //         const roundedCost = Math.ceil(item.cost / 1000) * 1000;
  //         return {
  //           ...item,
  //           cost: roundedCost,
  //           isValid:
  //             item.min !== undefined &&
  //             item.max !== undefined &&
  //             roundedCost >= item.min &&
  //             roundedCost <= item.max,
  //         };
  //       }
  //       return item;
  //     })
  //   );
  // }, []);

  const handleConfirmSend = () => {
    Alert.alert(
      "Xác nhận gửi báo giá",
      "Bạn có chắc muốn gửi báo giá cho khách hàng?",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Xác nhận", onPress: handleSendRepairQuote },
      ]
    );
  };

  // Xác nhận request cho guest
  const handleDone = () => {
    Alert.alert("Xác nhận báo giá", "Bạn có chắc muốn tạo báo giá này", [
      { text: "Huỷ", style: "cancel" },
      { text: "Xác nhận", onPress: handleUpdateGuestQuote },
    ]);
  };

  const sendRepairQuote = async (repairQuote: RepairQuote) => {
    const {
      detail,
      cost,
      requestdetailid,
      repaircostpreviewid,
      accessoryid,
      wage,
      total,
    } = repairQuote;
    const payload = {
      detail,
      cost,
      requestdetailid,
      repaircostpreviewid,
      accessoryid,
      wage,
      total,
    };
    console.log(payload);
    // Remove try-catch to let errors propagate
    const results = await createRepairQuote(payload, token);
    console.log(results);
    return results;
  };

  const handleSendRepairQuote = async () => {
    try {
      let newRepairQuotes = repairQuotes;
      if (repairQuotes.length >= 4) {
        newRepairQuotes = repairQuotes.filter(
          (item) => (item.wagerate ?? 0) > 0
        );
        if (newRepairQuotes.length >= 3) {
          removeBasicItems();
        }
      }
      await Promise.all(newRepairQuotes.map(sendRepairQuote));
      await updateRepairRequestStatus(requestDetailId, token, "Waiting");

      fetchData();

      Alert.alert("Thành công", "Báo giá đã được gửi!");
      setIsNew(false);
      // if (repairRequestDetail) {
      //   createDirectChannel(repairRequestDetail.customerid, requestDetailId);
      // }
    } catch (error) {
      console.error("Error sending repair quotes:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi gửi báo giá.");
    }
  };

  //Chuyển status thành Done nếu là khách ngoài
  const handleUpdateGuestQuote = async () => {
    try {
      await Promise.all(repairQuotes.map(sendRepairQuote));
      const result = await updateRepairRequestStatus(
        requestDetailId,
        token,
        "Waiting"
      );
      await updateRepairRequestStatus(requestDetailId, token, "Done");
      console.log(result);
      const payment = await createPayment(
        {
          requestdetailid: repairRequestDetail?.requestdetailid,
          totalamount: result.requestDetail.totalprice,
          paymentmethod: "Tiền mặt",
          paymentstatus: "Unpaid",
        },
        token
      );
      console.log(payment);
      fetchData();

      Alert.alert("Thành công", "Báo giá đã được tạo!");
      setIsNew(false);
      // if (repairRequestDetail) {
      //   createDirectChannel(repairRequestDetail.customerid, requestDetailId);
      // }
    } catch (error) {
      console.error("Error sending repair quotes:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi gửi báo giá.");
    }
  };

  const handleUpdateRepairStatus = async () => {
    const requestStatus = repairRequestDetail?.requeststatus;
    switch (requestStatus) {
      case "Accepted":
        await updateRepairRequestStatus(requestDetailId, token, "Repairing");
        console.log("Status updated to Repairing");
        break;
      case "Repairing":
        await updateRepairRequestStatus(requestDetailId, token, "Done");
        console.log(
          "Status updated to Done & Changed the status of return request to Pending"
        );
        break;
      default:
        break;
    }
    fetchData();
  };

  const toChatScreen = () => {
    router.push({
      pathname: "/user/mechanic/requests/chatScreen",
      params: {
        currentUserId: userId,
        requestDetailId: requestDetailId,
      },
    });
  };
  const onCallPress = () => {
    handlePhoneCall(repairRequestDetail?.customerphone);
  };

  const changePaymentStatus = async (newStatus: string) => {
    if (repairRequestDetail) {
      const payload = {
        requestDetailId: repairRequestDetail?.requestdetailid,
        newStatus,
      };
      const result = await updatePaymentStatus(payload, token);
      if (result) fetchData();
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (!repairRequestDetail) {
    return (
      <Box className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-gray-600 text-center">
          Không có yêu cầu sửa chữa
        </Text>
      </Box>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <ScrollView className="flex-1">
        <Box className="bg-[#1a3148] pt-14 pb-8 rounded-b-[32px]">
          <GoBackButton />
          <Box className="px-5">
            <Box className="flex-row items-center justify-between mt-6">
              <Text className="text-2xl font-bold text-white">
                Chi tiết sửa chữa
              </Text>
              <RepairStatusBadge status={repairRequestDetail.requeststatus} />
            </Box>
          </Box>
        </Box>

        <Box className="flex-1 px-2">
          <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <CustomerInfo
              repairRequestDetail={repairRequestDetail}
              onCallPress={onCallPress}
              toChatScreen={toChatScreen}
            />

            <Box className="mt-4 p-4 bg-[#f8fafc] rounded-xl border border-gray-100/80">
              <VehicleInfoBox repairRequestDetail={repairRequestDetail} />
            </Box>
          </Box>
          {repairRequestDetail?.licenseplate && (
            <Box className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <Box className="flex-row items-center justify-between mb-5">
                <Text className="text-lg font-bold text-[#1a3148]">
                  Báo giá sửa chữa
                </Text>
                {/* {isNew && ( */}
                <Text className="text-sm text-gray-500">
                  {repairQuotes.length || 0} linh kiện
                </Text>
                {/* )} */}
              </Box>

              <FlatList
                scrollEnabled={false}
                data={repairQuotes}
                keyExtractor={(item) => item?.index.toString()}
                ItemSeparatorComponent={() => <Box className="h-4" />}
                renderItem={({ item }) => (
                  <Box className="bg-[#f8fafc] rounded-xl p-4">
                    <Box className="mb-3">
                      {isNew ? (
                        <RepairCostPreviewSelect
                          brandId={repairRequestDetail?.brandid}
                          repairOptions={repairCostPreviews.filter(
                            (repair) =>
                              !repairQuotes.some(
                                (quote) => quote.repairname === repair.name
                              )
                          )}
                          selectedRepair={item.detail}
                          onSelectRepair={(
                            repair: RepairCostPreview,
                            accessory?: Accessory,
                            wage?: number,
                            total?: number
                          ) =>
                            handleRepairSelection(
                              item.index,
                              repair,
                              accessory,
                              wage,
                              total
                            )
                          }
                        />
                      ) : (
                        <Box>
                          <Text className="text-base font-semibold text-[#1a3148]">
                            {item.repairname || "No repair name found"}
                          </Text>
                          {item.accessoryname && (
                            <Text className="text-base font-semibold text-[#1a3148]">
                              {item.accessoryname || "No repair name found"}
                            </Text>
                          )}
                        </Box>
                      )}
                    </Box>

                    {isNew ? (
                      <Box className="flex-row items-center">
                        {/* <PriceInput
                        key={item.index}
                        item={item}
                        onPriceChange={handlePriceChange}
                        onBlur={handlePriceBlur}
                      /> */}
                        {repairQuotes.length > 1 && (
                          <Button
                            className="bg-red-500 h-12 w-full rounded-xl items-center justify-center"
                            onPress={() => removeRepairItem(item.index)}
                          >
                            <Text className="text-white text-xl font-bold">
                              ×
                            </Text>
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Box className="flex-row flex-wrap gap-2 mt-3">
                        <Box className="flex-1 items-start justify-between gap-1">
                          <Text className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            Giá: {formatMoney(item.cost)}
                          </Text>
                          <Text className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                            Phụ thu: {formatMoney(item.wage)}
                          </Text>
                        </Box>
                        {/* <Text className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          Rate: {item.wagerate}x
                        </Text> */}
                        <Box className="mt-3">
                          <Text className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
                            Tổng: {formatMoney(item.total)}
                          </Text>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              />
              {repairRequestDetail?.requeststatus !== "Done" &&
                repairRequestDetail?.requeststatus !== "Repairing" && (
                  <Box className="flex-1 items-start justify-between mt-5">
                    <Box className="flex-row items-center">
                      <CreditCard size={18} color="#1a3148" />
                      <Text className="text-base uppercase tracking-wider text-gray-500 ml-2">
                        Tổng chi phí
                      </Text>
                      <Text className="text-base uppercase tracking-wider text-gray-500 ml-2">
                        {formatMoney(
                          repairQuotes.reduce((sum, r) => sum + r.total, 0)
                        )}
                      </Text>
                    </Box>
                  </Box>
                )}

              {isNew && (
                <Box className="mt-6">
                  <Box className="flex flex-col gap-4">
                    <Button
                      onPress={addRepairItem}
                      disabled={isAddDisabled}
                      className={`h-12 rounded-xl ${
                        isAddDisabled ? "bg-gray-200" : "bg-[#fab753]"
                      }`}
                    >
                      <Text className="text-white font-bold">
                        + Thêm linh kiện sửa chữa
                      </Text>
                    </Button>

                    {repairQuotes.length > 0 &&
                    repairRequestDetail.receivername ? (
                      <Button
                        onPress={handleDone}
                        disabled={isSubmitDisabled}
                        className={`h-12 rounded-xl ${
                          isSubmitDisabled ? "bg-gray-200" : "bg-[#1a3148]"
                        }`}
                      >
                        <Text className="text-white font-bold">
                          Xác nhận báo giá
                        </Text>
                      </Button>
                    ) : (
                      <Button
                        onPress={handleConfirmSend}
                        disabled={isSubmitDisabled}
                        className={`h-12 rounded-xl ${
                          isSubmitDisabled ? "bg-gray-200" : "bg-[#1a3148]"
                        }`}
                      >
                        <Text className="text-white font-bold">
                          Gửi báo giá
                        </Text>
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {repairRequestDetail?.paymentmethod && (
            <Box className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <Box className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-[#1a3148]">
                  Trạng thái
                </Text>
                <Box
                  className={`px-3 py-1.5 rounded-full ${
                    repairRequestDetail.paymentstatus === "Success"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      repairRequestDetail.paymentstatus === "Success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {repairRequestDetail.paymentstatus === "Success"
                      ? "Đã thanh toán"
                      : "Chưa thanh toán"}
                  </Text>
                </Box>
              </Box>

              <Box className="bg-[#f8fafc] rounded-xl p-4">
                <Box className="flex-row items-center justify-between mb-4">
                  <Box>
                    <Box className="flex-row items-center mb-1">
                      <CreditCard size={18} color="#1a3148" />
                      <Text className="text-xs uppercase tracking-wider text-gray-500 ml-2">
                        Tổng đơn
                      </Text>
                    </Box>
                    <Text className="text-2xl font-bold text-[#1a3148]">
                      {formatMoney(repairRequestDetail.totalprice)}
                    </Text>
                  </Box>
                  <Box className="bg-black px-4 py-2 rounded-xl">
                    <Text className="text-white font-bold text-sm">
                      {repairRequestDetail?.paymentmethod}
                    </Text>
                  </Box>
                </Box>
              </Box>

              {repairRequestDetail?.paymentstatus === "Unpaid" &&
                ((repairRequestDetail?.paymentmethod === "Tiền mặt" &&
                  repairRequestDetail?.requeststatus === "Repairing") ||
                  repairRequestDetail?.requeststatus === "Done") && (
                  <Button
                    onPress={() => {
                      Alert.alert(
                        "Xác nhận thanh toán",
                        "Khách hàng đã thanh toán đầy đủ?",
                        [
                          { text: "Huỷ", style: "cancel" },
                          {
                            text: "Xác nhận",
                            onPress: () => changePaymentStatus("Success"),
                          },
                        ]
                      );
                    }}
                    disabled={repairRequestDetail?.requeststatus !== "Done"}
                    className={`h-12 rounded-xl mt-4 ${
                      repairRequestDetail?.requeststatus === "Done"
                        ? "bg-[#fab753]"
                        : "bg-gray-200"
                    }`}
                  >
                    <Text className="text-white font-bold">
                      Xác nhận thanh toán
                    </Text>
                  </Button>
                )}
            </Box>
          )}

          <Box className="my-6 space-y-4">
            {repairRequestDetail?.requeststatus !== "Inspecting" &&
              repairRequestDetail?.requeststatus !== "Done" && (
                <Button
                  onPress={handleUpdateRepairStatus}
                  disabled={
                    !["Accepted", "Repairing"].includes(
                      repairRequestDetail.requeststatus
                    )
                  }
                  className={`h-14 rounded-xl ${
                    ["Accepted", "Repairing"].includes(
                      repairRequestDetail.requeststatus
                    )
                      ? "bg-green-500 shadow-sm shadow-green-500/20"
                      : "bg-gray-200"
                  }`}
                >
                  <Text className="text-white text-base font-bold">
                    {repairRequestDetail?.requeststatus === "Repairing"
                      ? "Hoàn tất sửa chữa"
                      : "Bắt đầu sửa chữa"}
                  </Text>
                </Button>
              )}
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
