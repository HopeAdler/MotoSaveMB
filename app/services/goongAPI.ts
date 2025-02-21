// src/services/goongApi.ts
const { GOONG_API_KEY } = process.env;

export async function getReverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://rsapi.goong.io/geocode?latlng=${lat}%2C${lng}&api_key=${GOONG_API_KEY}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error("Error in getReverseGeocode", error);
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${GOONG_API_KEY}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error("Error in geocodeAddress", error);
    return null;
  }
}

export async function getAutocomplete(query: string, location?: string): Promise<any[]> {
  try {
    const locationParam = location ? `&location=${location}` : "";
    const response = await fetch(
      `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${query}${locationParam}`
    );
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.error("Error in getAutocomplete", error);
    return [];
  }
}

export async function getDirections(origin: string, destination: string): Promise<any> {
  try {
    const response = await fetch(
      `https://rsapi.goong.io/direction?origin=${origin}&destination=${destination}&vehicle=truck&api_key=${GOONG_API_KEY}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getDirections", error);
    throw error;
  }
}

const goongAPI = {
  getReverseGeocode,
  geocodeAddress,
  getAutocomplete,
  getDirections,
};

export default goongAPI;
