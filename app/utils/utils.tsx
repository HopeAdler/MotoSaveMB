import { jwtDecode, JwtPayload } from "jwt-decode";
import polyline from "@mapbox/polyline";
import { Alert, Linking, Platform } from "react-native";

// Hàm dịch các tên trường sang tiếng Việt
export const translateFieldName = (field: string): string => {
  // const fieldTranslations: Record<string, string> = {
  const fieldTranslations: any = {
    username: "Tên tài khoản",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu",
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



export const validateField = (field: string, value: string, formData?:any): string => {
  if (!value.trim()) {
    return `Vui lòng nhập ${translateFieldName(field).toLowerCase()}.`; // Dịch tự động
  }

  switch (field) {
    case "password":
      if (value.length < 6) {
        return "Mật khẩu phải có ít nhất 6 ký tự.";
      }
      break;
    
    case "confirmPassword":
      if (value !== formData?.password) return "Mật khẩu không khớp.";
      return "";

      case "phone":
        if (!/^0\d{9}$/.test(value)) {
          return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0";
        }
        break;
      
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

export const handlePhoneCall = async (phoneNumber: string | undefined) => {
  if (!phoneNumber) {
    Alert.alert("Error", "Driver phone number not available");
    return;
  }

  const formattedNumber = phoneNumber.replace(/[^\d+]/g, "");
  if (!formattedNumber) {
    Alert.alert("Error", "Invalid phone number format");
    return;
  }

  const phoneUrl = Platform.select({
    ios: `tel:${formattedNumber}`,
    android: `tel:${formattedNumber}`,
  });

  if (!phoneUrl) {
    Alert.alert("Error", "Phone calls not supported on this device");
    return;
  }

  try {
    const supported = await Linking.canOpenURL(phoneUrl);
    if (!supported) {
      Alert.alert("Error", "Phone calls not supported");
    } else {
      await Linking.openURL(phoneUrl);
    }
  } catch (error) {
    console.error("Error handling phone call:", error);
    Alert.alert("Error", "Could not make phone call");
  }
};

export function roundToThousand(value: number): number {
  // Math.ceil làm tròn lên. Floor là xuống
  return Math.ceil(value / 1000) * 1000;
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatMoney = (amount: number) => {
  return amount?.toLocaleString("vi-VN").replace(/,/g, ".") + "VNĐ";
}

export const groupActivitiesByDate = (activities: ActivityItem[]) => {
  return activities.reduce((groups, activity) => {
    const date = new Date(activity.createddate).toLocaleDateString('en-GB');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);
};

export interface ActivityItem {
  requestid: string;
  drivername: string | null;
  driverphone: string | null;
  requesttype: string;
  requestdetailid: string;
  servicepackagename: string;
  pickuplocation: string;
  destination: string;
  requeststatus: string;
  createddate: string;
  staffid: string | null;
}

const utils = {
  translateFieldName,
  validateField,
  handleBlurField,
  shortifiedFieldName,
  decodedToken,
  decodePolyline,
  handlePhoneCall,
  formatDate,
  formatMoney,
  groupActivitiesByDate,
};

export default utils;
