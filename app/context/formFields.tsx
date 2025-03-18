export const registerForm = {
  username: "",
  password: "",
  fullName: "",
  phone: "",
};


export const loginForm = {
  identifier: "", // Username hoặc số điện thoại
  password: "",
};

// formFields.tsx
export interface SearchResult {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};
export type User = {
  uuid: string;
  username: string;
  role: string;
  latitude: number;
  longitude: number;
};


export interface RequestDetail {
  fullname: string;
  phone: string;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  requeststatus: string;
  drivername: string;
  driverphone: string;
  licenseplate: string;
  brandname: string;
  vehicletype: string;
  vehiclestatus: string;
  requestid: string;
  servicepackagename: string;
}


const formFields = {
  registerForm,
  loginForm,
};

export default formFields;