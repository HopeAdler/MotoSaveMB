import axios from "axios";

export interface RescueRequestPayload {
  pickuplong: number;
  pickuplat: number;
  deslng: number;
  deslat: number;
  pickuplocation: string;
  destination: string;
  totalprice: number;
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
