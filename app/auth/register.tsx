import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { checkFieldAvailability } from "../services/beAPI";

export default function RegisterScreen() {
  const router = useRouter();
  const { serverError } = useLocalSearchParams<{ serverError?: string }>();

  const [form, setForm] = useState(registerForm);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  // true if any field has an error string or is still blank
  const hasErrors = Object
    .keys(form)
    .some(key => {
      const k = key as keyof typeof form;
      // you might also want to treat empty values as “error”:
      return !!errors[k] || form[k].trim() === "";
    });


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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    // 1) update form
    setForm(prev => ({ ...prev, [field]: value }));

    // 2) if already touched, run your sync validation
    if (touched[field]) {
      const syncError = validateField(field, value, form);
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: syncError }));

      // special case: re‑validate confirmPassword whenever password changes
      if (field === 'password' && touched.confirmPassword) {
        const confirmError = validateField(
          'confirmPassword',
          form.confirmPassword,
          { ...form, password: value }
        );
        setErrors((prev: Record<string, string>) => ({ ...prev, confirmPassword: confirmError }));
      }
    }

    // 3) if field is username or phone, debounce an availability check
    if (field === 'username' || field === 'phone') {
      // clear any existing timer
      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]);
      }

      // set a new debounce
      debounceTimers.current[field] = setTimeout(async () => {
        const { available, message } = await checkFieldAvailability(field, value);

        // only show an error if unavailable
        setErrors((prev: Record<string, string>) => ({
          ...prev,
          [field]: available ? prev[field] : message
        }));
      }, 600);
    }
  };


  useEffect(() => {
    if (serverError) {
      setErrors((prev: any) => ({ ...prev, server: serverError }));
      // clear it from URL so it doesn’t persist on reload:
      router.replace({ pathname: "/auth/register", params: {} });
    }
  }, [serverError]);

  const handleRegisterPress = () => {
    // 1. run blur/validation on every field
    Object.keys(form).forEach((f) => handleBlur(f));

    // 2. if there are errors, don’t navigate
    const hasErrors = Object
      .keys(form)
      .some((k) => errors[k] || form[k as keyof typeof form].trim() === "");
    if (hasErrors) return;

    // 3. navigate to OTP, passing every form field as a string param
    router.push({
      pathname: "/auth/otp",
      params: {
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
      },
    });
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
            onPress={handleRegisterPress}
            disabled={hasErrors}
            className={`
    h-14 rounded-xl 
    mt-2 shadow-sm 
    ${hasErrors
                ? "bg-gray-400 shadow-none"    // disabled style
                : "bg-[#fab753] shadow-[#fab753]/20"  // normal style
              }
  `}
          >
            <Box className="flex-row items-center justify-center">
              <Text
                className={`text-lg font-bold ${hasErrors ? "text-gray-200" : "text-white"
                  }`}
              >
                Đăng ký
              </Text>
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
