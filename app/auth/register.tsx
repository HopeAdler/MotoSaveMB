// import React, { useEffect } from 'react';
// import { useRouter } from 'expo-router';
// import { Box } from '@/components/ui/box';
// import { Text } from '@/components/ui/text';
// import { Button } from '@/components/ui/button';

// export default function RegisterScreen() {
//     const router = useRouter();

//     return (
//         <Box className='flex-1 justify-center items-center'>
//             <Text bold size='2xl'>
//                 Welcome to My App bitches
//                 This is RegisterScreen
//             </Text>
//             <Button onPress={() =>  router.navigate("/auth/login")}> <Text> login</Text> </Button>

//         </Box>
//     );
// }
// //Screen nay la cho cai viec gioi thieu app nhu cramataA


// import React, { useState } from "react";
// import { useRouter } from "expo-router";
// import { Box } from "@/components/ui/box";
// import { Text } from "@/components/ui/text";
// import { Button } from "@/components/ui/button";
// import { Input, InputField } from "@/components/ui/input";
// import {
//   FormControl,
//   FormControlLabel,
//   FormControlLabelText,
//   FormControlError,
//   FormControlErrorText,
// } from "@/components/ui/form-control";

// export default function RegisterScreen() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     username: "",
//     password: "",
//     fullName: "",
//     phone: "",
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [touched, setTouched] = useState<Record<string, boolean>>({});

//   const validateField = (field: string, value: string): string => {
//     if (!value.trim()) {
//       return `${field} is required.`;
//     }
//     if (field === "password" && value.length < 6) {
//       return "Password must be at least 6 characters.";
//     }
//     if (field === "phone" && !/^\d+$/.test(value)) {
//       return "Phone number must contain only digits.";
//     }
//     return "";
//   };

//   const handleBlur = (field: string) => {
//     setTouched((prev) => ({ ...prev, [field]: true }));
//     const error = validateField(field, form[field as keyof typeof form]);
//     setErrors((prev) => ({ ...prev, [field]: error }));
//   };

//   const handleChange = (field: string, value: string) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//     if (touched[field]) {
//       const error = validateField(field, value);
//       setErrors((prev) => ({ ...prev, [field]: error }));
//     }
//   };

//   const handleSubmit = async () => {
//     const newErrors: Record<string, string> = {};
//     Object.keys(form).forEach((field) => {
//       const error = validateField(field, form[field as keyof typeof form]);
//       if (error) newErrors[field] = error;
//     });

//     if (Object.keys(newErrors).length) {
//       setErrors(newErrors);
//       return;
//     }

//     try {
//       const response = await fetch(
//         "https://motor-save-be.vercel.app/api/v1/auth/register",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(form),
//         }
//       );

//       if (response.status === 201) {
//         router.navigate("/auth/login");
//       } else if (response.status === 400) {
//         setErrors({ password: "Password must be at least 6 characters." });
//       } else if (response.status === 404) {
//         setErrors({
//           username: "Username already exists.",
//           phone: "Phone number already exists.",
//         });
//       } else {
//         setErrors({ server: "Internal Server Error. Please try again later." });
//       }
//     } catch (error) {
//       setErrors({ server: "Network Error. Please try again." });
//     }
//   };

//   return (
//     <Box className="flex-1 p-6 justify-center">
//       <Text bold size="2xl" className="text-center mb-6">
//         Register
//       </Text>

//       {["username", "password", "fullName", "phone"].map((field) => (
//         <FormControl key={field} isInvalid={!!errors[field]} className="mb-4">
//           <FormControlLabel>
//             <FormControlLabelText>
//               {field.charAt(0).toUpperCase() + field.slice(1)}
//             </FormControlLabelText>
//           </FormControlLabel>
//           <Input>
//             <InputField
//               placeholder={`Enter your ${field}`}
//               secureTextEntry={field === "password"}
//               keyboardType={field === "phone" ? "numeric" : "default"}
//               value={form[field as keyof typeof form]}
//               onChangeText={(value) => handleChange(field, value)}
//               onBlur={() => handleBlur(field)}
//             />
//           </Input>
//           {errors[field] && (
//             <FormControlError>
//               <FormControlErrorText>{errors[field]}</FormControlErrorText>
//             </FormControlError>
//           )}
//         </FormControl>
//       ))}

//       {errors.server && (
//         <Text className="text-red-500 text-center mb-4">{errors.server}</Text>
//       )}

//       <Button onPress={handleSubmit}>Register</Button>
//       <Text
//         className="text-blue-500 text-center mt-4"
//         onPress={() => router.navigate("/auth/login")}
//       >
//         Already have an account? Login here.
//       </Text>
//     </Box>
//   );
// }

// import React, { useState } from "react";
// import { useRouter } from "expo-router";
// import { Box } from "@/components/ui/box";
// import { Text } from "@/components/ui/text";
// import { Button } from "@/components/ui/button";
// import { Input, InputField } from "@/components/ui/input";
// import {
//   FormControl,
//   FormControlLabel,
//   FormControlLabelText,
//   FormControlError,
//   FormControlErrorText,
// } from "@/components/ui/form-control";
// import { validateField } from "../utils/utils";
// import { initialFormState } from "../context/formFields";

// export default function RegisterScreen() {
//   const router = useRouter();

//   const [form, setForm] = useState(initialFormState);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [touched, setTouched] = useState<Record<string, boolean>>({});

//   const handleBlur = (field: string) => {
//     setTouched((prev) => ({ ...prev, [field]: true }));
//     const error = validateField(field, form[field as keyof typeof form]);
//     setErrors((prev) => ({ ...prev, [field]: error }));
//   };

//   const handleChange = (field: string, value: string) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//     if (touched[field]) {
//       const error = validateField(field, value);
//       setErrors((prev) => ({ ...prev, [field]: error }));
//     }
//   };

//   const handleSubmit = async () => {
//     const newErrors: Record<string, string> = {};
//     Object.keys(form).forEach((field) => {
//       const error = validateField(field, form[field as keyof typeof form]);
//       if (error) newErrors[field] = error;
//     });

//     if (Object.keys(newErrors).length) {
//       setErrors(newErrors);
//       return;
//     }

//     try {
//       const response = await fetch(
//         "https://motor-save-be.vercel.app/api/v1/auth/register",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(form),
//         }
//       );

//       if (response.status === 201) {
//         router.navigate("/auth/login");
//       } else if (response.status === 400) {
//         setErrors({ password: "Password must be at least 6 characters." });
//       } else if (response.status === 404) {
//         setErrors({
//           username: "Username already exists.",
//           phone: "Phone number already exists.",
//         });
//       } else {
//         setErrors({ server: "Internal Server Error. Please try again later." });
//       }
//     } catch (error) {
//       setErrors({ server: "Network Error. Please try again." });
//     }
//   };

//   return (
//     <Box className="flex-1 p-6 justify-center">
//       <Text bold size="2xl" className="text-center mb-6">
//         Register
//       </Text>

//       {Object.keys(initialFormState).map((field) => (
//         <FormControl key={field} isInvalid={!!errors[field]} className="mb-4">
//           <FormControlLabel>
//             <FormControlLabelText>
//               {field.charAt(0).toUpperCase() + field.slice(1)}
//             </FormControlLabelText>
//           </FormControlLabel>
//           <Input>
//             <InputField
//               placeholder={`Enter your ${field}`}
//               secureTextEntry={field === "password"}
//               keyboardType={field === "phone" ? "numeric" : "default"}
//               value={form[field as keyof typeof form]}
//               onChangeText={(value) => handleChange(field, value)}
//               onBlur={() => handleBlur(field)}
//             />
//           </Input>
//           {errors[field] && (
//             <FormControlError>
//               <FormControlErrorText>{errors[field]}</FormControlErrorText>
//             </FormControlError>
//           )}
//         </FormControl>
//       ))}

//       {errors.server && (
//         <Text className="text-red-500 text-center mb-4">{errors.server}</Text>
//       )}

//       <Button onPress={handleSubmit}>Register</Button>
//       <Text
//         className="text-blue-500 text-center mt-4"
//         onPress={() => router.navigate("/auth/login")}
//       >
//         Already have an account? Login here.
//       </Text>
//     </Box>
//   );
// }


import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import {
    FormControl,
    FormControlLabel,
    FormControlLabelText,
    FormControlError,
    FormControlErrorText,
} from "@/components/ui/form-control";
import { validateField, handleBlurField, translateFieldName } from "@/app/utils/utils";
import { registerForm } from "@/app/context/formFields";

export default function RegisterScreen() {
    const router = useRouter();


    const [form, setForm] = useState(registerForm);
    //NAY LA DANH CHO SET STATE CUA CAC INPUT FIELD

    // const [errors, setErrors] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<any>({});
    //NAY LA VIEC SET ERROR 

    // const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [touched, setTouched] = useState<any>({});
    //NAY LA CHECK XEM USER CO TAP VAO INPUT HAY CHUA

    const handleBlur = (field: string) => {
        handleBlurField(field, form, setTouched, setErrors);
        //NAY LA LAY BEN UTILS QUA NO LO HET VIEC KIEM TRA NGUOI DUNG CO TAP CAI INPUT HAY CHUA
    };

    const handleChange = (field: string, value: string) => {
        //NAY LA DE LO CAI THAY DOI TRANG THAI  TRONG INPUT

        setForm((prev) => ({ ...prev, [field]: value }));

        //NEU NGUOI DUNG DUNG CAI INPUT ROI THI NO CHECK XEM FIELD CO DUOC NHAP DUNG HAY |CHUA/NHAP SAI FORMAT|
        if (touched[field]) {
            const error = validateField(field, value);

            //NAY THI SET ERROR THOI

            // setErrors((prev) => ({ ...prev, [field]: error }));
            setErrors((prev: any) => ({ ...prev, [field]: error }));
        }
    };
    const handleSubmit = async () => {
        // Kiểm tra validation
        const newErrors: any = {};
        Object.keys(form).forEach((field) => {
            const error = validateField(field, form[field as keyof typeof form]);
            if (error) newErrors[field] = error;
        });

        if (Object.keys(newErrors).length) {
            setErrors(newErrors); // Nếu có lỗi, hiển thị lỗi
            return;
        }

        try {
            // Gửi request đăng ký với axios
            const response = await axios.post(
                "https://motor-save-be.vercel.app/api/v1/auth/register",
                form, // Dữ liệu từ form
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            // Kiểm tra mã trạng thái và xử lý kết quả
            if (response.status === 201) {
                // Đăng ký thành công, chuyển hướng đến màn hình đăng nhập
                router.navigate("/auth/login");
            } else if (response.status === 400) {
                // Xử lý lỗi 400 (Cần dữ liệu)
                const errorData = response.data;
                setErrors({ server: errorData.message });
            } else if (response.status === 404) {
                // Lỗi không tìm thấy
                const errorData = response.data;
                setErrors({ server: errorData.message });
            } else {
                // Lỗi khác
                const errorData = response.data;
                setErrors({ server: errorData.message });
            }
        } catch (error: any) {
            // Bắt lỗi nếu xảy ra
            if (error.response) {
                // Lỗi từ server
                setErrors({ server: error.response.data.message });
            } else if (error.request) {
                // Lỗi không nhận được phản hồi
                setErrors({ server: "Không thể kết nối đến máy chủ." });
            } else {
                // Lỗi khác
                setErrors({ server: "Đã xảy ra lỗi. Vui lòng thử lại sau." });
            }
        }
    };
    return (
        <Box className="flex-1 p-6 justify-center">
            <Text bold size="2xl" className="text-center mb-6">
                Register
            </Text>

            {Object.keys(registerForm).map((field) => (//NAY LA CAC INPUT FIELD DUOC MAP RA DUA TREN CAI FORMFIELDS 
                <FormControl key={field} isInvalid={!!errors[field]} className="mb-4">
                    <FormControlLabel>
                        <FormControlLabelText>
                            {/* {field.charAt(0).toUpperCase() + field.slice(1)} */}
                            {translateFieldName(field)}
                        </FormControlLabelText>
                    </FormControlLabel>
                    <Input>
                        <InputField
                            // placeholder={`Nhập ${field}`}
                            placeholder={`Nhập ${translateFieldName(field).charAt(0).toLowerCase() + translateFieldName(field).slice(1)}`}
                            secureTextEntry={field === "password"}
                            keyboardType={field === "phone" ? "numeric" : "default"}
                            value={form[field as keyof typeof form]}
                            onChangeText={(value) => handleChange(field, value)}
                            onBlur={() => handleBlur(field)}
                        />
                    </Input>
                    {errors[field] && (
                        <FormControlError>
                            <FormControlErrorText>{errors[field]}</FormControlErrorText>
                        </FormControlError>
                    )}
                </FormControl>
            ))}

            {errors.server && (
                <Text className="text-red-500 text-center mb-4">{errors.server}</Text>
                // console.log(errors.server)
            )}
            <Button onPress={handleSubmit}><Text>Register</Text></Button>
            <Text
                className="text-blue-500 text-center mt-4"
                onPress={() => router.navigate("/auth/login")}
            >
                Có TK rồi mà còn vào đây? Đăng nhập ngay đây.
            </Text>
        </Box>
    );
}
