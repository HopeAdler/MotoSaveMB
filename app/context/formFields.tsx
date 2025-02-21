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

const formFields = {
  registerForm,
  loginForm,
};

export default formFields;