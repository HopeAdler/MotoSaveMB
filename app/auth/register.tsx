import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import {
    FormControl,
    FormControlError,
    FormControlErrorText,
} from "@/components/ui/form-control";
import { validateField, handleBlurField, translateFieldName } from "@/app/utils/utils";
import { registerForm } from "@/app/context/formFields";
import { Image } from "react-native";
import { UserPlus, Lock, User, Phone } from "lucide-react-native";

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

    const getIcon = (field: string) => {
        switch (field) {
            case "username":
                return <User size={24} color="#6B7280" />;
            case "password":
                return <Lock size={24} color="#6B7280" />;
            case "fullName":
                return <UserPlus size={24} color="#6B7280" />;
            case "phone":
                return <Phone size={24} color="#6B7280" />;
            default:
                return null;
        }
    };

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
            setErrors(newErrors);
            return;
        }

        try {
            const response = await axios.post(
                "https://motor-save-be.vercel.app/api/v1/auth/register",
                form,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 201) {
                router.navigate("/auth/login");
            } else if (response.status === 400) {
                const errorData = response.data;
                setErrors({ server: errorData.message });
            } else if (response.status === 404) {
                const errorData = response.data;
                setErrors({ server: errorData.message });
            } else {
                const errorData = response.data;
                setErrors({ server: errorData.message });
            }
        } catch (error: any) {
            if (error.response) {
                setErrors({ server: error.response.data.message });
            } else if (error.request) {
                setErrors({ server: "Không thể kết nối đến máy chủ." });
            } else {
                setErrors({ server: "Đã xảy ra lỗi. Vui lòng thử lại sau." });
            }
        }
    };

    return (
        <Box className="flex-1 bg-white justify-center p-6">
            <Box className="items-center mb-8">
                <Image
                    source={require("../../assets/images/logo.png")}
                    style={{ width: 120, height: 120 }}
                    resizeMode="contain"
                />
            </Box>

            <Box className="bg-white rounded-3xl p-8 shadow-lg">
                {Object.keys(registerForm).map((field) => (
                    <FormControl key={field} isInvalid={!!errors[field]} className="mb-6">
                        <Box className="relative">
                            <Box className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                {getIcon(field)}
                            </Box>
                            <Input>
                                <InputField
                                    placeholder={`${translateFieldName(field)}`}
                                    secureTextEntry={field === "password"}
                                    keyboardType={field === "phone" ? "numeric" : "default"}
                                    className="bg-gray-50 h-14 pl-14 rounded-xl text-lg"
                                    value={form[field as keyof typeof form]}
                                    onChangeText={(value) => handleChange(field, value)}
                                    onBlur={() => handleBlur(field)}
                                />
                            </Input>
                        </Box>
                        {errors[field] && (
                            <FormControlError>
                                <FormControlErrorText className="text-sm mt-2">
                                    {errors[field]}
                                </FormControlErrorText>
                            </FormControlError>
                        )}
                    </FormControl>
                ))}

                {errors.server && (
                    <Text className="text-red-500 text-center text-sm mb-4">
                        {errors.server}
                    </Text>
                )}

                <Button 
                    onPress={handleSubmit}
                    className="bg-blue-600 h-12 rounded-xl mt-4"
                >
                    <Box className="flex-row items-center">
                        <UserPlus size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-semibold text-lg">Đăng ký</Text>
                    </Box>
                </Button>

                <Box className="flex-row justify-center mt-6">
                    <Text className="text-gray-600">Đã có tài khoản? </Text>
                    <Text
                        className="text-blue-600 font-semibold"
                        onPress={() => router.navigate("/auth/login")}
                    >
                        Đăng nhập ngay
                    </Text>
                </Box>
            </Box>
        </Box>
    );
}
