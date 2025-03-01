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

const formFields = {
  registerForm,
  loginForm,
};

export default formFields;