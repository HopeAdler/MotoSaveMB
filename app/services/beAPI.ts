import axios from "axios";
import { Alert } from "react-native";

export interface RescueRequestPayload {
  pickuplong: number;
  pickuplat: number;
  deslng: number;
  deslat: number;
  pickuplocation: string;
  destination: string;
  totalprice: number;
}

export interface FloodRescueRequestPayload {
  pickuplong: number;
  pickuplat: number;
  pickuplocation: string;
  totalprice: number;
}

export interface Transaction {
  requestdetailid: string;
  zptransid: string;
  totalamount: number | null;
  paymentmethod: string;
  paymentstatus: string;
}

export interface Feedback {
  rating: number;
  comment: string;
}

// Hàm fetch danh sách station
export async function fetchStations(): Promise<any> {
  try {
    const response = await axios.get("https://motor-save-be.vercel.app/api/v1/stations");
    return response.data;
  } catch (error) {
    console.error("Error fetching stations", error);
    Alert.alert("Lỗi", "Không thể lấy danh sách trạm sửa xe");
    throw error;
  }
}

export async function createRescueRequest(
  payload: RescueRequestPayload,
  token: string
): Promise<any> {
  try {
    const response = await axios.post(
      "https://motor-save-be.vercel.app/api/v1/requests/normalRescue",
      payload,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating rescue request", error);
    throw error;
  }
}

export async function createEmergencyRescueRequest(
  payload: RescueRequestPayload,
  token: string
): Promise<any> {
  try {
    const response = await axios.post(
      "https://motor-save-be.vercel.app/api/v1/requests/emergencyRescue",
      payload,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating rescue request", error);
    throw error;
  }
}

export async function createFloodRescueRequest(
  payload: FloodRescueRequestPayload,
  token: string
): Promise<any> {
  try {
    const response = await axios.post(
      "https://motor-save-be.vercel.app/api/v1/requests/floodRescue",
      payload,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating rescue request", error);
    throw error;
  }
}

export async function createTransaction(
  payload: Transaction,
  token: string
): Promise<any> {
  try {
    const response = await axios.post(
      "https://motor-save-be.vercel.app/api/v1/transactions",
      payload,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating transaction", error);
    throw error;
  }
}

export async function createFeedback(
  requestdetailid: string,
  payload: Feedback,
  token: string
): Promise<any> {
  try {
    const response = await axios.post(
      `https://motor-save-be.vercel.app/api/v1/feedbacks/create/${requestdetailid}`,
      payload,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating transaction", error);
    throw error;
  }
}

export async function updateRequestStatus(
  requestdetailid: string,
  token: string,
  status: string
): Promise<any> {
  try {
    const response = await axios.put(
      `https://motor-save-be.vercel.app/api/v1/requests/${requestdetailid}/status`,
      { newStatus: status },
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Error updating request status:", error.response.data);
    } else {
      console.error("Network or unknown error:", error.message);
    }
    throw error;
  }
}

export async function calculateFare(distance: number): Promise<number> {
  try {
    const response = await axios.get(
      `https://motor-save-be.vercel.app/api/v1/distance/calculate?distance=${distance}`
    );
    return response.data.totalMoney;
  } catch (error) {
    console.error("Error calculating fare", error);
    throw error;
  }
}

export async function fetchRequests(token: string): Promise<any> {
  try {
    const response = await axios.get(
      "https://motor-save-be.vercel.app/api/v1/requests/driver",
      { headers: { Authorization: "Bearer " + token } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

export async function acceptRequest(requestdetailid: string, token: string): Promise<any> {
  try {
    await axios.put(
      `https://motor-save-be.vercel.app/api/v1/requests/${requestdetailid}/accept`,
      {},
      { headers: { Authorization: "Bearer " + token } }
    );
    Alert.alert("Success", "Request accepted!");
  } catch (error) {
    console.error("Error accepting request:", error);
    Alert.alert("Error", "Failed to accept request");
  }
}

export async function createRepairRequest(requestId: string, token: string): Promise<any> {
  try {
    await axios.post(
      `https://motor-save-be.vercel.app/api/v1/requests/repair/${requestId}`,
      {},
      { headers: { Authorization: "Bearer " + token } }
    );
    Alert.alert("Success", "Repair request created!");
  } catch (error) {
    console.error("Error creating reppair request:", error);
    Alert.alert("Error", "Failed to create repair request");
  }
}

export async function cancelRequest(
  requestdetailid: string,
  token: string,
  note: string
): Promise<any> {
  try {
    const response = await axios.put(
      `https://motor-save-be.vercel.app/api/v1/requests/${requestdetailid}/cancel`,
      { note },
      {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error cancelling ride:", error);
    throw error;
  }
}

const beAPI = {
  createRescueRequest,
  createEmergencyRescueRequest,
  createFloodRescueRequest,
  createTransaction,
  createFeedback,
  updateRequestStatus,
  calculateFare,
  fetchRequests,
  acceptRequest,
  cancelRequest,
  fetchStations, // Thêm fetchStations vào export
};

export default beAPI;
