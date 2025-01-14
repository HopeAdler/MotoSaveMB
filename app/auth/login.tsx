// import React, { useEffect } from 'react';
// import { useRouter } from 'expo-router';
// import { Box } from '@/components/ui/box';
// import { Text } from '@/components/ui/text';
// import { Button } from '@/components/ui/button';

// export default function LoginScreen() {
//     const router = useRouter();

//     return (
//         <Box className='flex-1 justify-center items-center'>
//             <Text bold size='2xl'>
//                 Welcome to My App bitches
//                 This is LoginScreen
//             </Text>
//             <Button onPress={() =>  router.navigate("/auth/register")}><Text>Register</Text></Button>
//             <Button onPress={() =>  router.navigate("/auth/forgot-pass")}><Text>Forgot password?</Text></Button>
//             <Button onPress={() =>  router.navigate("/auth/otp")}><Text>OTP</Text></Button>
//             <Button onPress={() =>  router.navigate("/user/customer/home")}><Text>customer home</Text></Button>
//             <Button onPress={() =>  router.navigate("/user/driver/home")}><Text>driver home</Text></Button>
//             <Button onPress={() =>  router.navigate("/user/mechanic/home")}><Text>mechanic home</Text></Button>
//         </Box>
//     );
// }
// //Screen nay la cho cai viec gioi thieu app nhu cramata

import React, { useContext, useState } from "react";
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
import {
  validateField,
  handleBlurField,
  translateFieldName,
  shortifiedFieldName,
} from "@/app/utils/utils";
import { loginForm } from "@/app/context/formFields";
import { AuthContext } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

      // if (response.status === 201) {
      //   const { user, token } = response.data;
      //   dispatch?.({ type: "LOGIN_SUCCESS", payload: { user, token } });

      //   // Navigate based on user role
      //   switch (user.role) {
      //     case "Customer":
      //       router.navigate("/user/customer/home");
      //       break;
      //     case "Driver":
      //       router.navigate("/user/driver/home");
      //       break;
      //     case "Mechanic":
      //       router.navigate("/user/mechanic/home");
      //       break;
      //     default:
      //       // router.navigate("/error/404");//vì lí do nào đó, rout không nhận ra.
      //       break;
      //   }
      // } 
      // Sau khi đăng nhập thành công
      if (response.status === 201) {
        const { user, token } = response.data;
        dispatch?.({ type: "LOGIN_SUCCESS", payload: { user, token } });

        // Lưu thông tin vào AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("token", token);

        // Điều hướng dựa trên vai trò
        switch (user.role) {
          case "Customer":
            router.navigate("/user/customer/home");
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
      }

      else {
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
    <Box className="flex-1 p-6 justify-center">
      <Text bold size="2xl" className="text-center mb-6">
        Login
      </Text>

      {Object.keys(loginForm).map((field) => (
        <FormControl key={field} isInvalid={!!errors[field]} className="mb-4">
          <FormControlLabel>
            <FormControlLabelText>
              {translateFieldName(field)}
            </FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              placeholder={`Nhập ${translateFieldName(field).charAt(0).toLowerCase() +
                translateFieldName(field).slice(1)
                }`}
              secureTextEntry={field === "password"}
              keyboardType={"default"}
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
      )}
      <Button onPress={handleSubmit}>
        <Text>Login</Text>
      </Button>
      <Text
        className="text-blue-500 text-center mt-4"
        onPress={() => router.navigate("/auth/register")}
      >
        Éo có tài khoản? Đăng ký ngay đây.
      </Text>
    </Box>
  );
}
