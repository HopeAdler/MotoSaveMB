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
    // Giả sử response.data.totalMoney chứa số tiền cước
    return response.data.totalMoney;
  } catch (error) {
    console.error("Error calculating fare", error);
    throw error;
  }
}

export async function fetchRequests
  (
    token: string,
  ): Promise<any> {
  try {
    const response = await axios.get(
      "https://motor-save-be.vercel.app/api/v1/requests/driver",
      { headers: { Authorization: "Bearer " + token } }
    );
    return (response.data);
  } catch (error) {
    console.error("Error fetching requests:", error);
  };
}

export async function acceptRequest
  (
    requestdetailid: string, token: string
  ): Promise<any> {
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
};

const beAPI = {
  createRescueRequest,
  createTransaction,
  calculateFare,
  updateRequestStatus,
  fetchRequests,
  acceptRequest
};

export default beAPI;
