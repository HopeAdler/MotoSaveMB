import { GoBackButton } from "@/components/custom/GoBackButton";
import React, { useState } from "react";
import { Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function RepairDetailsScreen() {
  const [repairs, setRepairs] = useState([{ id: 1, detail: "", price: "" }]);

  const addRepairItem = () => {
    setRepairs([...repairs, { id: repairs.length + 1, detail: "", price: "" }]);
  };

  return (
    <View style={styles.container}>
      <GoBackButton/>
      <Text style={styles.header}>Chi tiết sửa xe</Text>
      
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
          data={repairs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.repairRow}>
              <TextInput style={styles.input} placeholder="Chi tiết hư" value={item.detail} />
              <TextInput style={styles.input} placeholder="Giá" keyboardType="numeric" value={item.price} />
            </View>
          )}
        />
        <TouchableOpacity style={styles.addButton} onPress={addRepairItem}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
        <Button title="Gửi báo giá">
        </Button>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.chatButton}><Text>Chat</Text></TouchableOpacity>
        <TouchableOpacity style={styles.submitButton}><Text>Gửi cho user xem</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  infoBox: { flexDirection: "row", alignItems: "center", padding: 10, borderWidth: 1, marginVertical: 5 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "gray", marginRight: 10 },
  squareIcon: { width: 40, height: 40, backgroundColor: "gray", marginRight: 10 },
  repairSection: { borderWidth: 1, padding: 10, marginVertical: 10 },
  repairRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
  input: { borderWidth: 1, flex: 1, padding: 5, marginHorizontal: 5 },
  addButton: { alignSelf: "center", padding: 10, backgroundColor: "lightgray", borderRadius: 20, marginTop: 10 },
  addText: { fontSize: 18 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  chatButton: { padding: 10, borderWidth: 1, borderRadius: 5 },
  submitButton: { padding: 10, borderWidth: 1, borderRadius: 5 }
});
