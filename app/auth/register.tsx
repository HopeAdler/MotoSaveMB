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
import {
  validateField,
  handleBlurField,
  translateFieldName,
} from "@/app/utils/utils";
import { registerForm } from "@/app/context/formFields";
import { Image } from "react-native";
import { UserPlus, Lock, User, Phone, Check } from "lucide-react-native";

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState(registerForm);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});

  const getIcon = (field: string) => {
    switch (field) {
      case "username":
        return <User size={24} color="#fab753" />;
      case "password":
        return <Lock size={24} color="#fab753" />;
      case "confirmPassword":
        return <Check size={24} color="#fab753" />;
      case "fullName":
        return <UserPlus size={24} color="#fab753" />;
      case "phone":
        return <Phone size={24} color="#fab753" />;
      default:
        return null;
    }
  };

  const handleBlur = (field: string) => {
    const error = validateField(field, form[field as keyof typeof form], form);
    setTouched((prev: any) => ({ ...prev, [field]: true }));
    setErrors((prev: any) => ({ ...prev, [field]: error }));
    // handleBlurField(field, form, setTouched, setErrors);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const updatedForm = { ...form, [field]: value };
      const error = validateField(field, value);
      setErrors((prev: any) => ({ ...prev, [field]: error }));

      if (field === "password" && touched.confirmPassword) {
        const confirmError = validateField(
          "confirmPassword",
          updatedForm.confirmPassword,
          updatedForm
        );
        setErrors((prev: any) => ({
          ...prev,
          confirmPassword: confirmError,
        }))
      }
    }
  };

  const handleSubmit = async () => {
    const newErrors: any = {};
    Object.keys(form).forEach((field) => {
      const error = validateField(
        field,
        form[field as keyof typeof form],
        form
      );
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setTouched(
        Object.keys(form).reduce(
          (acc, field) => ({
            ...acc,
            [field]: true,
          }),
          {}
        )
      );
      return;
    }

    const { confirmPassword, ...payload } = form;

    try {
      const response = await axios.post(
        "https://motor-save-be.vercel.app/api/v1/auth/register",
        payload,
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

  const handleOTPSend = async () => {
    const { phone } = form;
    try {
      router.push({
        pathname: "/auth/otp",
        params: { phoneNumber: phone },
      });
    } catch (error) {
      setErrors({ server: "Gửi OTP không thành công." });
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
            Tạo tài khoản
          </Text>
          <Text className="text-white/60 text-base mt-1">
            Đăng ký để bắt đầu
          </Text>
        </Box>
      </Box>

      <Box className="px-6 -mt-12">
        <Box className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          {Object.keys(registerForm).map((field) => (
            <FormControl
              key={field}
              isInvalid={!!errors[field]}
              className="mb-5"
            >
              <Box className="relative">
                <Box className="absolute left-4 top-1.5 z-10">
                  {getIcon(field)}
                </Box>
                <Input>
                  <InputField
                    placeholder={`${translateFieldName(field)}`}
                    secureTextEntry={field === "password" || field === "confirmPassword"}
                    keyboardType={field === "phone" ? "numeric" : "default"}
                    className={`w-full bg-gray-50 h-[52px] pl-14 rounded-xl ${errors[field]
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
              <Text className="text-white font-bold text-lg">Đăng ký</Text>
            </Box>
          </Button>
          <Button
            onPress={handleOTPSend}
            className="h-14 rounded-xl bg-[#fab753] mt-2 shadow-sm shadow-[#fab753]/20"
          >
            <Box className="flex-row items-center">
              <Text className="text-white font-bold text-lg">TestOTP</Text>
            </Box>
          </Button>

          <Box className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Đã có tài khoản? </Text>
            <Text
              className="text-[#fab753] font-semibold"
              onPress={() => router.navigate("/auth/login")}
            >
              Đăng nhập
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
