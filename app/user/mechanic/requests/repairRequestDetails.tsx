import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GoBackButton } from "@/components/custom/GoBackButton";
import RepairCostPreviewSelect from "@/components/custom/RepairCostPreviewSelect";
import { createRepairQuote, getRepairCostPreview, getRepairQuotesByRequestDetailId, getRepairRequestDetailForMechanic, updateRepairRequestStatus } from "@/app/services/beAPI";
import { KeyboardAvoidingView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AuthContext from "@/app/context/AuthContext";
import { decodedToken } from "@/app/utils/utils";
import { usePubNubService } from "@/app/services/pubnubService";

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
  customeravatar: string
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
  repairName?: string;
  detail: string;
  cost: number;
  requestdetailid: string;
  repaircostpreviewid: number;
  createdDate?: string;
  updatedDate?: string;
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

        setRepairQuotes(updatedResults);
      } else {
        // If no repair quotes exist, initialize a new one
        setRepairQuotes([{ index: 1, detail: "", cost: 0, requestdetailid: requestDetailId, repaircostpreviewid: 0 }]);
      }

      console.log("Fetched repair quotes:", results);
    } catch (error) {
      console.error("Error fetching repair quotes:", error);
    }
  };


  useEffect(() => {
    fetchRepairRequestDetail()
    fetchRepairCostPreview()
    fetchRepairQuotes()
  }, [])

  const addRepairItem = () => {
    setRepairQuotes([
      ...repairQuotes,
      {
        index: repairQuotes.length + 1,
        repairName: "",
        detail: "",
        cost: 0,
        requestdetailid: requestDetailId,
        repaircostpreviewid: 0,
      },
    ]);
  };

  const removeRepairItem = (index: number) => {
    setRepairQuotes((prev) => prev.filter((item) => item.index !== index));
  };

  const isAddDisabled = repairQuotes.some(
    (item) => item.cost === 0 || !item.repairName
  );
  const isSubmitDisabled = repairQuotes.some(
    (item) => item.min !== undefined && item.max !== undefined &&
      (item.cost < item.min || item.cost > item.max)
      || !item.repairName
  );

  const handleRepairSelection = (index: number, selectedRepair: RepairCostPreview) => {
    setRepairQuotes((prev) =>
      prev.map((item) =>
        item.index === index
          ? {
            ...item,
            repairName: selectedRepair.name,
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
    console.log(repairQuotes);

    try {
      await Promise.all(repairQuotes.map(sendRepairQuote));
      await updateRepairRequestStatus(requestDetailId, token, 'Waiting')
      Alert.alert("Thành công", "Báo giá đã được gửi!");
      if (repairRequestDetail)
        createDirectChannel(repairRequestDetail.customerid, requestDetailId)
    } catch (error) {
      console.error("Error sending repair quotes:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi gửi báo giá.");
    }
  };

  const toChatScreen = () => {
    router.push({
      pathname: "/user/mechanic/requests/chatScreen",
      params: {
        currentUserId: userId,
        requestDetailId: requestDetailId
      }
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={{ flex: 1 }}>

        <View style={styles.container}>
          <GoBackButton />
          <Text style={styles.header}>Chi tiết sửa xe: {repairRequestDetail?.requestdetailid}</Text>
          <Text>{repairRequestDetail?.customername}</Text>
          <Text>{repairRequestDetail?.customerphone}</Text>

          {/* Customer Info */}
          <View style={styles.infoBox}>
            <View style={styles.avatar} />
            <Text>Thông tin Cus</Text>
          </View>

          {/* Vehicle Info */}
          <View style={styles.infoBox}>
            <View style={styles.squareIcon} />
            <Text>Thông tin xe (biển số)</Text>
          </View>

          {/* Repair Details */}
          <View style={styles.repairSection}>
            <Text>Bảng báo giá</Text>
            <FlatList
              scrollEnabled={false}
              data={repairQuotes}
              keyExtractor={(item) => item?.index.toString()}
              renderItem={({ item }) => (
                <View style={styles.repairItemContainer}>
                  {/* First Row - Repair Type Selection */}
                  <View style={styles.selectContainer}>
                    <RepairCostPreviewSelect
                      repairOptions={repairCostPreviews.filter(
                        (repair) => !repairQuotes.some((quote) => quote.repairName === repair.name)
                      )}
                      selectedRepair={item.detail}
                      onSelectRepair={(repair) => handleRepairSelection(item.index, repair)}
                    />
                  </View>

                  {/* Second Row - Input & Remove Button */}
                  <View style={styles.inputRow}>
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

                    <TouchableOpacity style={styles.removeButton} onPress={() => removeRepairItem(item.index)}>
                      <Text style={styles.removeText}>X</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            <TouchableOpacity
              style={[styles.addButton, (isAddDisabled) && styles.disabledButton]}
              onPress={addRepairItem}
              disabled={isAddDisabled}
            >
              <Text style={styles.addText}>+</Text>
            </TouchableOpacity>

            {/* "Gửi báo giá" Button */}
            <Button title="Gửi báo giá" disabled={isSubmitDisabled}
              onPress={handleConfirmSend} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.chatButton}
              onPress={toChatScreen}>
              <Text>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton}>
              <Text>Gửi cho user xem</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    marginVertical: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "gray",
    marginRight: 10,
  },
  squareIcon: {
    width: 40,
    height: 40,
    backgroundColor: "gray",
    marginRight: 10,
  },
  repairSection: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
  repairListContainer: {
    maxHeight: 300, // Set a fixed height so FlatList scrolls within this area
    minHeight: 150, // Prevent it from collapsing when few items exist
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  chatButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
  submitButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
});

