import AuthContext from "@/app/context/AuthContext";
import LoadingScreen from "@/app/loading/loading";
import { createRepairQuote, getRepairCostPreview, getRepairQuotesByRequestDetailId, getRepairRequestDetailForMechanic, updateRepairRequestStatus } from "@/app/services/beAPI";
import { usePubNubService } from "@/app/services/pubnubService";
import { decodedToken } from "@/app/utils/utils";
import { GoBackButton } from "@/components/custom/GoBackButton";
import { RepairStatusBadge } from "@/components/custom/MechanicStatusBadge";
import RepairCostPreviewSelect from "@/components/custom/RepairCostPreviewSelect";
import { CustomerInfo } from "@/components/custom/RepairCustomerInfo";
import { VehicleInfoBox } from "@/components/custom/VehicleInfoBox";
import { Box } from "@/components/ui/box";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
        console.log('Status updated to Done')
        break;
      default:
        break;

    }
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
  }

  if (isLoading) return <LoadingScreen />
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={{ flex: 1 }}>
        <Box style={styles.container}>
          <GoBackButton />
          <Text style={styles.header}>Chi tiết sửa xe:</Text>
          {/* Customer Info */}
          <CustomerInfo repairRequestDetail={repairRequestDetail}
            onCallPress={onCallPress} toChatScreen={toChatScreen} />
          {repairRequestDetail && <RepairStatusBadge status={repairRequestDetail?.requeststatus} />}

          {/* Vehicle Info */}
          <VehicleInfoBox repairRequestDetail={repairRequestDetail} />

          {/* Repair Details */}
          <Box style={styles.repairSection}>
            <Text style={{ fontWeight: "700" }}>Bảng báo giá:</Text>
            <FlatList
              scrollEnabled={false}
              data={repairQuotes}
              keyExtractor={(item) => item?.index.toString()}
              renderItem={({ item }) => (
                <Box style={styles.repairItemContainer}>
                  {/* First Row - Repair Type Selection */}
                  <Box style={styles.selectContainer}>
                    {isNew ?
                      <RepairCostPreviewSelect
                        repairOptions={repairCostPreviews.filter(
                          (repair) => !repairQuotes.some((quote) => quote.repairname === repair.name)
                        )}
                        selectedRepair={item.detail}
                        onSelectRepair={(repair) => handleRepairSelection(item.index, repair)}
                      />
                      :
                      <Text className="justify-center align-middle">
                        {item.repairname || "No repair name found"}
                      </Text>
                    }
                  </Box>

                  {/* Second Row - Input & Remove Button */}
                  {isNew ?
                    <Box style={styles.inputRow}>
                      <TextInput
                        style={[
                          styles.input,
                          item.min && item.max && (item.cost < item.min || item.cost > item.max)
                            ? styles.invalidInput
                            : null,
                        ]}
                        placeholder="Giá"
                        keyboardType="numeric"
                        value={item.cost === 0 ? "" : item.cost.toString()} // Show empty string when 0
                        onChangeText={(text) => handlePriceChange(item.index, text)} // Pass raw text
                      />
                      {repairQuotes.length > 1 &&
                        <TouchableOpacity style={styles.removeButton}
                          onPress={() => removeRepairItem(item.index)}>
                          <Text style={styles.removeText}>X</Text>
                        </TouchableOpacity>
                      }
                    </Box>
                    :
                    <Text>{item.cost}</Text>
                  }
                </Box>
              )}
            />

            {isNew &&
              <Box>
                <TouchableOpacity
                  style={[styles.addButton, (isAddDisabled) && styles.disabledButton]}
                  onPress={addRepairItem}
                  disabled={isAddDisabled}
                >
                  <Text style={styles.addText}>+</Text>
                </TouchableOpacity>

                {/* "Gửi báo giá" Button */}
                {
                  repairQuotes.length > 0 &&
                  <Button title="Gửi báo giá" disabled={isSubmitDisabled}
                    onPress={handleConfirmSend} />
                }
              </Box>
            }
          </Box>

          {/* Footer */}
          <Box style={styles.footer}>
            {repairRequestDetail &&
              <Button
                title={repairRequestDetail?.requeststatus === 'Repairing' ? "Hoàn tất sửa chữa" : "Bắt đầu sửa xe"}
                onPress={handleUpdateRepairStatus}
                disabled={!['Accepted', 'Repairing'].includes(repairRequestDetail.requeststatus)}
              />
            }
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  repairSection: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 10,
    marginVertical: 10,
  },
  repairListContainer: {
    maxHeight: 300,
    minHeight: 150,
  },
  repairItemContainer: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: "#f9f9f9",
  },
  selectContainer: {
    marginBottom: 10, // Adds space between rows
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  invalidInput: {
    borderColor: "red",
    borderWidth: 2,
  },
  removeButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  removeText: {
    color: "white",
    fontWeight: "bold",
  },
  addButton: {
    alignSelf: "center",
    padding: 10,
    backgroundColor: "lightgreen",
    borderRadius: 20,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "gray",
    opacity: 0.5,
  },
  addText: {
    fontSize: 18,
  },
  footer: {
    flexDirection: "column",
    alignItems: 'center',
    justifyContent: "space-between",
    marginTop: 20,
  },
  chatButton: {
    alignSelf: 'flex-end',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
});