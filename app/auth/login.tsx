import React, { useContext, useState } from "react";
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
import {
  validateField,
  handleBlurField,
  translateFieldName,
} from "@/app/utils/utils";
import { loginForm } from "@/app/context/formFields";
import { AuthContext } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogIn, Lock, User } from "lucide-react-native";
import { Image } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { dispatch } = useContext(AuthContext);
  const [form, setForm] = useState(loginForm);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});

  const handleBlur = (field: string) => {
    handleBlurField(field, form, setTouched, setErrors);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev: any) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async () => {
    dispatch?.({ type: "LOGIN_START" });
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
        "https://motor-save-be.vercel.app/api/v1/auth/login",
        form,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 201) {
        const { user, token } = response.data;
        dispatch?.({ type: "LOGIN_SUCCESS", payload: { user, token } });

        // Lưu thông tin vào AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("token", token);

        // Điều hướng dựa trên vai trò
        switch (user.role) {
          case "Customer":
            router.navigate("/user/customer/home/homepage");
            break;
          case "Driver":
            router.replace("/user/driver/home");
            break;
          case "Mechanic":
            router.replace("/user/mechanic/home");
            break;
          default:
            // Điều hướng đến lỗi nếu không có vai trò hợp lệ
            router.replace("/error/404");
            break;
        }
      } else {
        // Handle other status codes
        const errorData = response.data;
        dispatch?.({ type: "LOGIN_FAILURE", payload: errorData.message });
        setErrors({ server: errorData.message });
      }
    } catch (error: any) {
      // Handle request errors
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
    <Box className="flex-1 bg-[#f8fafc]">
      <Box className="bg-[#1a3148] h-[45%] rounded-b-[40px] shadow-lg px-6 pt-12 pb-20">
        <Box className="items-center justify-end flex-1 pb-6">
          <Image
            source={require("../../assets/images/logo.png")}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
          <Text className="text-white text-2xl font-bold mt-4">
            Chào mừng trở lại
          </Text>
          <Text className="text-white/60 text-base mt-1">
            Đăng nhập để tiếp tục
          </Text>
        </Box>
      </Box>

      <Box className="px-6 -mt-12">
        <Box className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          {Object.keys(loginForm).map((field) => (
            <FormControl key={field} isInvalid={!!errors[field]} className="mb-5">
              <Box className="relative">
                <Box className="absolute left-4 top-1.5 z-10">
                  {field === "identifier" ? (
                    <User size={24} color={errors[field] ? "#EF4444" : "#fab753"} />
                  ) : (
                    <Lock size={24} color={errors[field] ? "#EF4444" : "#fab753"} />
                  )}
                </Box>
                <Input>
                  <InputField
                    placeholder={`${translateFieldName(field)}`}
                    secureTextEntry={field === "password"}
                    className={`w-full bg-gray-50 h-[52px] pl-14 rounded-xl ${
                      errors[field] 
                        ? "border-red-500 border-2" 
                        : "border border-gray-200"
                    }`}
                    style={{
                      fontSize: 16,
                      lineHeight: 24,
                      paddingVertical: 14,
                      minHeight: 56,
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={form[field as keyof typeof form]}
                    onChangeText={(value) => handleChange(field, value)}
                    onBlur={() => handleBlur(field)}
                  />
                </Input>
              </Box>
              {errors[field] && (
                <FormControlError>
                  <FormControlErrorText className="text-sm mt-2 text-red-500">
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
            className="h-14 rounded-xl bg-[#fab753] mt-2 shadow-sm shadow-[#fab753]/20"
          >
            <Box className="flex-row items-center">
              <Text className="text-white font-bold text-lg">Đăng nhập</Text>
            </Box>
          </Button>

          <Box className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Chưa có tài khoản? </Text>
            <Text
              className="text-[#fab753] font-semibold"
              onPress={() => router.navigate("/auth/register")}
            >
              Đăng ký
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
