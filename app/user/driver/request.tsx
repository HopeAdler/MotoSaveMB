import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoIcon } from "lucide-react-native";
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

type RequestType = "Rescue" | "Transport" | "Return";

type Request = {
    id: string;
    type: RequestType;
    details: string;
};

const requests: Request[] = [
    { id: "1", type: "Rescue", details: "Rescue at river bank" },
    { id: "2", type: "Transport", details: "Transport to hospital" },
    { id: "3", type: "Return", details: "Return to home" },
    { id: "4", type: "Rescue", details: "Rescue from mountain" },
    { id: "5", type: "Transport", details: "Transport to shelter" },
    { id: "6", type: "Return", details: "Return to base" },
];

const groupedRequests: Record<RequestType, Request[]> = {
    Rescue: requests.filter((req) => req.type === "Rescue"),
    Transport: requests.filter((req) => req.type === "Transport"),
    Return: requests.filter((req) => req.type === "Return"),
};

export default function DRequestScreen() {
    return (
        <View style={styles.container}>
            {Object.keys(groupedRequests).map((category) => (
                <View key={category} style={styles.section}>
                    <Text style={styles.sectionTitle}>{category} Requests</Text>
                    <FlatList
                        data={groupedRequests[category as RequestType]}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <Card style={styles.card}>
                                <Text style={styles.cardText}>{item.details}</Text>
                                <Button variant="outline">
                                    <Text>Xem chi tiết</Text>
                                </Button>
                            </Card>
                        )}
                    />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: "#f4f4f4",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    card: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardText: {
        fontSize: 16,
    },
});
