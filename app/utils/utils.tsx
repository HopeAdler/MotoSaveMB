import { Dispatch, SetStateAction, useMemo } from "react";
import { jwtDecode, JwtPayload } from "jwt-decode";
import polyline from "@mapbox/polyline";
// Hàm dịch các tên trường sang tiếng Việt
export const translateFieldName = (field: string): string => {
  // const fieldTranslations: Record<string, string> = {
  const fieldTranslations: any = {
    username: "Tên người dùng",
    password: "Mật khẩu",
    fullName: "Họ và tên",
    phone: "Số điện thoại",
    identifier: "Tên đăng nhập/ Số điện thoại",

    //CHI CAN THEM CAI CAN DICH TRONG DAY LA XONG
  };

  // Kiểm tra xem có tồn tại tên trường trong bảng dịch hay không, nếu không trả về tên gốc
  return fieldTranslations[field] || field;
};

type MyTokenPayload = {
  id: string; // Adjust type if needed (e.g., `number` if it's numeric)
} & JwtPayload; // Extend default JWT payload (which includes `exp`, `iat`)

export const decodedToken = (token: string | null) => {
  if (token != null)
    return jwtDecode<MyTokenPayload>(token);
  else return;
};

export const shortifiedFieldName = (field: string): string => {
  const shortTranslations: any = {
    username: "TĐ",
    // password: "Mật khẩu",
    // fullName: "Họ và tên",
    phone: "SĐT",
    identifier: "Tên TK/ SĐT",

  }

  return shortTranslations[field] || field;
}



export const validateField = (field: string, value: string): string => {
  if (!value.trim()) {
    return `Vui lòng nhập ${translateFieldName(field).toLowerCase()}.`; // Dịch tự động
  }

  switch (field) {
    case "password":
      if (value.length < 6) {
        return "Mật khẩu phải có ít nhất 6 ký tự.";
      }
      break;
    case "phone":
      if (value.length < 10) {
        return "Số điện thoại phải là 10 chữ số";
      }
      break;
    case "userName":
    case "identifier":
      // Giả sử identifier có thể là username hoặc phone, nếu bạn cần kiểm tra dạng khác, có thể tùy chỉnh
      if (value.length < 6) {
        return "Tên đăng nhập phải có ít nhất 6 ký tự.";
      }
      break;

    default:
      return "";
  }

  return ""; // Nếu không có lỗi nào
};


// Hàm handleBlur tái sử dụng
export const handleBlurField = (
  field: string,
  // form: Record<string, string>,
  form: any,
  // setTouched: Dispatch<SetStateAction<Record<string, boolean>>>,
  setTouched: any,
  // setErrors: Dispatch<SetStateAction<Record<string, string>>>
  setErrors: any
) => {
  // DANH DAU CAC CAI FIELD MA NGUOI DUNG TAP VAO (touched)
  // setTouched((prev) => ({ ...prev, [field]: true }));
  setTouched((prev: any) => ({ ...prev, [field]: true }));
  // VALIDATE FIELD DO NEU MA CO
  const error = validateField(field, form[field as keyof typeof form]);
  // setErrors((prev) => ({ ...prev, [field]: error }));
  setErrors((prev: any) => ({ ...prev, [field]: error }));
};




/**
 * Giải mã polyline: chuyển chuỗi mã hóa thành mảng tọa độ theo định dạng [lng, lat]
 */
export function decodePolyline(encoded: string): [number, number][] {
  return polyline.decode(encoded).map(([lat, lng]: [number, number]) => [lng, lat]);
}

const utils = {
  translateFieldName,
  validateField,
  handleBlurField,
  shortifiedFieldName,
  decodedToken,
  decodePolyline,
};

export default utils;
