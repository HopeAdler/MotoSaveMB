import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

type Transaction = {
    id: string;
    amount: number;
    date: string;
    status: "Processed" | "Pending" | "Failed";
};

const transactions: Transaction[] = [
    { id: "1", amount: 150.75, date: "2025-02-14 15:03:55", status: "Processed" },
    { id: "2", amount: 99.99, date: "2025-02-13 09:03:55", status: "Processed" },
    { id: "3", amount: 200.5, date: "2025-02-12 18:03:55", status: "Processed" },
    { id: "4", amount: 50.25, date: "2025-02-11 10:03:55", status: "Processed" },
    { id: "5", amount: 300.0, date: "2025-02-10 12:03:55", status: "Processed" },
];

export default function MTransactionHistoryScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Transaction History</Text>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                        <View style={styles.cardContent}>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>Amount: {item.amount.toFixed(2)} VND</Text>
                                <Text style={styles.cardText}>Date: {item.date}</Text>
                                <Text style={styles.cardText}>Status: {item.status}</Text>
                            </View>
                            <Button style={styles.button} onPress={() => console.log(`Navigating to ${item.id}`)} >
                            </Button>
                        </View>
                    </Card>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f4f4f4",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    card: {
        padding: 15,
        borderRadius: 12,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
        marginBottom: 15,
    },
    cardContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
    cardText: {
        fontSize: 16,
        color: "#555",
    },
    button: {
        backgroundColor: "#007bff",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
    },
});