import axios from "axios";
import { Alert } from "react-native";

export interface RescueRequestPayload {
  pickuplong: number | any;
  pickuplat: number | any;
  deslng: number;
  deslat: number;
  pickuplocation: string | any;
  destination: string;
  totalprice: number;
}

export interface EmergencyRescueRequestPayload {
  pickuplong: number;
  pickuplat: number;
  deslng: number;
  deslat: number;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  stationid: string;
  vehicleid: string;
}

export interface EmergencyRequestForGuest {
  receivername: string,
  receiverphone: string,
  pickuplong: number;
  pickuplat: number;
  deslng: number;
  deslat: number;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  stationid: string;
}
export interface FloodRescueRequestPayload {
  pickuplong: number;
  pickuplat: number;
  pickuplocation: string;
  totalprice: number;
}

export interface Transaction {
  requestdetailid: string | any;
  zptransid: string;
  totalamount: number | null;
  paymentmethod: string;
  paymentstatus: string;
}

export interface Payment {
  requestdetailid: string | any;
  totalamount: number | null;
  paymentmethod: string;
  paymentstatus: string;
}

export interface PaymentHistory {
  paymentid: string;
  requestid: string;
  requestdetailid: string;
  servicepackagename: string;
  requesttypename: string;
  requeststatus: string;
  updateddate: string;
  paymentmethod: string;
  paymentstatus: string;
  totalamount: number;
  transactionid: string | null;
  zptransid: string | null;
  transactiondate: string | null;
}

export interface UpdatedPayment {
  requestDetailId: string | any;
  newStatus: string;
}
export interface UpdatedPaymentTotal {
  requestDetailId: string;
  newTotal: number;
}

export interface Feedback {
  rating: number;
  comment: string;
}

export interface RepairQuote {
  detail: string;
  cost: number;
  requestdetailid: string,
  repaircostpreviewid: number,
  accessoryid: number | null,
  wage: number,
  total: number,
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  rate: number,
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
  payload: EmergencyRescueRequestPayload,
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

export async function createEmergencyRequestForGuest(
  payload: EmergencyRequestForGuest,
  token: string
): Promise<any> {
  try {
    const response = await axios.post(
      "https://motor-save-be.vercel.app/api/v1/requests/guest/emergencyRescue",
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

export async function createReturnVehicleRequest(
  payload: RescueRequestPayload,
  token: string,
  requestId: string | any,
): Promise<any> {
  try {
    const response = await axios.post(
      `https://motor-save-be.vercel.app/api/v1/requests/returnVehicle/${requestId}`,
      payload,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating return request", error);
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

export const updatePaymentInfo = async (requestdetailid: string | any, updatedData: any, token: string) => {
  try {
    const response = await axios.put(
      `https://motor-save-be.vercel.app/api/v1/transactions/payment/info/${requestdetailid}`,
      updatedData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
};

export async function createPayment(
  payload: Payment,
  token: string
): Promise<any> {
  try {
    const response = await axios.post(
      "https://motor-save-be.vercel.app/api/v1/transactions/payment",
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

export async function updatePaymentStatus(
  payload: UpdatedPayment,
  token: string
): Promise<any> {
  try {
    const response = await axios.put(
      "https://motor-save-be.vercel.app/api/v1/transactions/payment/update",
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

export async function updatePaymentTotal(
  payload: UpdatedPaymentTotal,
  token: string
): Promise<any> {
  try {
    const response = await axios.put(
      "https://motor-save-be.vercel.app/api/v1/transactions/payment/update/total",
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

export async function createRepairQuote(
  payload: RepairQuote,
  token: string
): Promise<any> {
  try {
    const response = await axios.post(
      `https://motor-save-be.vercel.app/api/v1/repairquotes`,
      payload,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating repairquote", error);
    throw error;
  }
}
export async function updateRepairRequestStatus(
  requestdetailid: string,
  token: string,
  status: string
): Promise<any> {
  try {
    const response = await axios.put(
      `https://motor-save-be.vercel.app/api/v1/requests/${requestdetailid}/repair/status`,
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
      console.error("Error updating repair request status:", error.response.data);
    } else {
      console.error("Network or unknown error:", error.message);
    }
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

export async function calculateFare(distance: number, serPacRate: number, waiting: number): Promise<number> {
  try {
    const response = await axios.get(
      `https://motor-save-be.vercel.app/api/v1/distance/calculate?distance=${distance}&serpacrate=${serPacRate}&waiting=${waiting}`
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

export async function fetchRescueRequestDetail(token: string, requestDetailId: string): Promise<any> {
  try {
    const response = await axios.get(
      `https://motor-save-be.vercel.app/api/v1/requests/driver/${requestDetailId}`,
      { headers: { Authorization: "Bearer " + token } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

export async function fetchStationOfAStaff(token: string): Promise<any> {
  try {
    const response = await axios.get(
      "https://motor-save-be.vercel.app/api/v1/staffinstations/station/staff",
      { headers: { Authorization: "Bearer " + token } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

export async function getPendingRepairRequests(token: string): Promise<any> {
  try {
    const response = await axios.get(
      "https://motor-save-be.vercel.app/api/v1/requests/mechanic/pending",
      { headers: { Authorization: "Bearer " + token } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

export async function getPendingReturnRequest(token: string): Promise<any> {
  try {
    const response = await axios.get(
      "https://motor-save-be.vercel.app/api/v1/requests/driver/return/pending",
      { headers: { Authorization: "Bearer " + token } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

export async function getRepairRequestsByMechanic(token: string): Promise<any> {
  try {
    const response = await axios.get(
      "https://motor-save-be.vercel.app/api/v1/requests/mechanic",
      { headers: { Authorization: "Bearer " + token } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

export async function getRepairRequestDetailForMechanic(token: string, requestId: string): Promise<any> {
  try {
    const response = await axios.get(
      `https://motor-save-be.vercel.app/api/v1/requests/mechanic/repair/detail/${requestId}`,
      { headers: { Authorization: "Bearer " + token } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

export async function getRepairQuotesByRequestDetailId(requestDetailId: string): Promise<any> {
  try {
    const response = await axios.get(
      `https://motor-save-be.vercel.app/api/v1/repairquotes/requestdetail/${requestDetailId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching repair quotes:", error);
  }
}


export async function acceptRequest(requestdetailid: string, token: string): Promise<any> {
  try {
    const response = await axios.put(
      `https://motor-save-be.vercel.app/api/v1/requests/${requestdetailid}/accept`,
      {},
      { headers: { Authorization: "Bearer " + token } }
    );

    // If request is successful, return the response data
    return response.data;
  } catch (error: any) {
    console.error("Error accepting request:", error);

    // Extract error message from response
    let errorMessage = "Failed to accept request";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    // Throw the error so the caller knows it failed
    throw new Error(errorMessage);
  }
}

export async function acceptEmergencyRequest(requestdetailid: string, token: string): Promise<any> {
  try {
    const response = await axios.put(
      `https://motor-save-be.vercel.app/api/v1/requests/emergency/${requestdetailid}/accept`,
      {},
      { headers: { Authorization: "Bearer " + token } }
    );

    // If request is successful, return the response data
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.message || "Failed to accept request";

      if (status === 404 || status === 409) {
        // Only log if 404 or 409
        console.warn(`Accept request warning (${status}):`, errorMessage);
        return null; // or you can return something else if you prefer
      }

      // For other errors, throw normally
      throw new Error(errorMessage);
    } else {
      // Non-HTTP error (like network error)
      console.error("Non-response error accepting request:", error.message);
      throw new Error("Network error or server unreachable");
    }
  }
}

export async function acceptRepairQuote(requestdetailid: string | any, token: string): Promise<any> {
  try {
    await axios.put(
      `https://motor-save-be.vercel.app/api/v1/requests/repairQuote/${requestdetailid}/accept`,
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

export async function acceptRepairRequest(requestdetailid: string, token: string): Promise<any> {
  try {
    await axios.put(
      `https://motor-save-be.vercel.app/api/v1/requests/mechanic/${requestdetailid}/accept`,
      {},
      { headers: { Authorization: "Bearer " + token } }
    );
    Alert.alert("Success", "Repair request accepted!");
  } catch (error) {
    console.error("Error accepting request:", error);
    Alert.alert("Error", "Failed to accept repair request");
  }
}

export async function getRepairCostPreview() {
  try {
    const response = await axios.get("https://motor-save-be.vercel.app/api/v1/repaircostpreviews");
    return response.data;
  } catch (error) {
    console.error("Error fetching repaircostpreviews:", error);
  }
}

export async function getAcsrByBrandAndParCat(parCatId: number, brandId: number) {
  try {
    const response = await axios.get(`
      https://motor-save-be.vercel.app/api/v1/accessories/parcatandbrand?parCatId=${parCatId}&brandId=${brandId}     `);
    return response.data;
  } catch (error) {
    console.error("Error fetching accessories:", error);
  }
}

export async function getUnpaidPaymentsByRequestId(requestId: string, token: string) {
  try {
    const response = await axios.get(`https://motor-save-be.vercel.app/api/v1/transactions/payment/unpaid/request/${requestId}`,
      { headers: { Authorization: "Bearer " + token } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching unpaid payments:", error);
  }
}

export async function getUndoneRequestDetailIds(token: string) {
  try {
    const response = await axios.get(`https://motor-save-be.vercel.app/api/v1/requests/driver/undone`,
      { headers: { Authorization: "Bearer " + token } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching unpaid payments:", error);
  }
}

export async function cancelRequest(
  requestdetailid: string | any,
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

export async function getServicePackageByName(serPacName: string): Promise<any> {
  try {
    const response = await axios.get(
      `https://motor-save-be.vercel.app/api/v1/servicepackages/findByName?name=${serPacName}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching repair quotes:", error);
  }
}

export async function checkFieldAvailability(
  fieldName: string,
  fieldValue: string
): Promise<{ available: boolean; message: string }> {
  try {
    const response = await axios.get(
      `https://motor-save-be.vercel.app/api/v1/auth/check-field`,
      {
        params: { fieldName, fieldValue },
      }
    );

    return {
      available: true,
      message: response.data.message, // e.g., "username có thể sử dụng"
    };
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 409) {
        return {
          available: false,
          message: error.response.data.message, // e.g., "username đã tồn tại"
        };
      }
    }

    return {
      available: false,
      message: 'Không thể kiểm tra. Vui lòng thử lại sau.',
    };
  }
}

export const updateRequestVehicle = async (requestid: string | any, vehicleId: string | any, token: string) => {
  try {
    const response = await axios.put(
      `https://motor-save-be.vercel.app/api/v1/customerVehicles/guest/${requestid}`,
      { vehicleId: vehicleId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating request vehicle:", error);
    throw error;
  }
};

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
