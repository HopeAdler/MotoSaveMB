export const registerForm = {
  username: "",
  password: "",
  confirmPassword: "",
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
  heading: number;
};

export interface RequestItem {
  requestid: string;
  servicepackagename: string;
  requestdetailid: string;
  requesttype: string;
  customername: string;
  customerphone: string;
  pickuplocation?: string;
  destination?: string;
  requeststatus: string;
  createddate: string;
}

export interface RequestDetail {
  fullname: string;
  phone: string;
  pickuplocation: string;
  destination: string;
  totalprice: number;
  requeststatus: string;
  driverid: string;
  drivername: string;
  driverphone: string;
  licenseplate: string;
  brandname: string;
  vehicletype: string;
  vehiclestatus: string;
  requestid: string;
  requestdetailid: string;
  servicepackagename: string;
}

export interface RepairRequestDetail {
  requestid: string;
  requesttype: string;
  requestdetailid: string;
  requeststatus: string;
  totalprice: number,
  createddate: string;
  stationid: string;
  stationname: string;
  stationaddress: string;
  long: number;
  lat: number;
  mechanicid: string;
  mechanicname: string;
  mechanicphone: string;
  mechanicavatar: string;
}

export interface RepairQuote {
  id: string;
  requestdetailid: string;
  repairpackagename: string;
  repairname: string;
  detail: string;
  partcategoryname: string;
  accessoryname: string;
  cost: number;
  wagerate: number;
  wage: number;
  total: number;
}

export interface RepairCostPreview {
  id: string;
  name: string;
  description: string;
  repairpackageid: number;
  repairpackagename?: string;
  partcategoryid: number;
  partcategoryname?: string;
  min: number;
  max: number;
  wage: number;
  rate: number;
}
export interface Accessory {
  id: number,
  partcategoryname: string;
  brandname: string,
  accessoryname: string;
  cost: number;
}

const formFields = {
  registerForm,
  loginForm,
};

export default formFields;