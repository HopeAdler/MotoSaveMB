import React, { useState, useCallback } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Input, InputField } from "@/components/ui/input";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import {
  Radio,
  RadioGroup,
  RadioLabel,
  RadioIndicator,
  RadioIcon,
} from "@/components/ui/radio";
import { useLocalSearchParams, router } from "expo-router";
import { Alert, Image, Pressable, ActivityIndicator, ScrollView } from "react-native";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { storage } from "@/firebaseConfig";
import { User, ChevronLeft, Camera, CircleIcon, ChevronDown, CalendarDaysIcon } from "lucide-react-native";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DateTimePicker from '@react-native-community/datetimepicker';

interface FormData {
  fullname: string;
  email: string | null;
  gender: string | undefined;
  dob: string | null;
  address: string | null;
  licenseplate: string | null;
  avatar: string | null;
}

interface UpdateProfilePayload {
  fullname: string;
  email: string | null;
  gender: string | undefined;
  dob: string | null;
  address: string | null;
  licenseplate: string | null;
  avatar: string | null;
}

const isValidDate = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  if (date > new Date()) return false;

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);
  if (date < minDate) return false;

  return true;
};
const formatDateString = (isoDate: string): string => {
  if (!isoDate) return "";
  return isoDate.split("T")[0];
};

export default function MEditProfile() {
  const { token, dispatch } = useContext(AuthContext);
  const params = useLocalSearchParams();

  const [form, setForm] = useState<FormData>(() => ({
    fullname: params.fullname as string,
    email: params.email as string | null,
    gender: params.gender as string || undefined,
    dob: params.dob ? formatDateString(params.dob as string) : null,
    address: params.address as string | null,
    licenseplate: params.licenseplate as string | null,
    avatar: params.avatar as string | null,
  }));

  const [selectedImage, setSelectedImage] = useState<{
    base64: string;
    uri: string;
  } | null>(null);

  const [isFormChanged, setIsFormChanged] = useState(false);

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // Add gender sheet state
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const genderOptions = ["Male", "Female", "Prefer not to disclose"];

  // Modify form state update to check for changes
  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => {
      const newForm = { ...prev, ...updates };
      
      const fieldComparisons = {
        gender: () => updates.gender !== params.gender,
        email: () => updates.email !== params.email,
        fullname: () => updates.fullname !== params.fullname,
        dob: () => updates.dob !== (params.dob ? formatDateString(params.dob as string) : null),
        address: () => updates.address !== params.address,
        licenseplate: () => updates.licenseplate !== params.licenseplate,
        avatar: () => updates.avatar !== params.avatar
      };

      const updatedField = Object.keys(updates)[0] as keyof FormData;

      setIsFormChanged((prev) => {
        if (updatedField && updatedField in fieldComparisons) {
          return fieldComparisons[updatedField]() || selectedImage !== null;
        }

        const hasChanged = Object.keys(fieldComparisons).some(
          (key) => fieldComparisons[key as keyof FormData]()
        );
        return hasChanged || selectedImage !== null;
      });

      return newForm;
    });
  };

  // Modify pickImage to update form changed state
  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        // Update selected image and form changed state
        setSelectedImage({
          base64: result.assets[0].base64,
          uri: result.assets[0].uri,
        });
        // Set form changed state directly when image is selected
        setIsFormChanged(true);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to access photo library");
    }
  };

  // Modify handleSubmit to validate first
  const handleSubmit = async () => {
    try {
      const errors = [];
      if (!form.fullname.trim()) {
        errors.push("Full name is required");
      }
      if (form.dob && !isValidDate(form.dob)) {
        errors.push("Invalid date format. Use YYYY-MM-DD");
      }

      if (errors.length > 0) {
        Alert.alert("Validation Error", errors.join("\n"));
        return;
      }

      setIsLoading(true);

      let avatarUrl = form.avatar;
      if (selectedImage) {
        try {
          const timestamp = Date.now();
          const filename = `profile_${timestamp}.jpg`;
          const storageRef = ref(storage, `profile-images/${filename}`);

          const response = await fetch(selectedImage.uri);
          const blob = await response.blob();

          await uploadBytes(storageRef, blob);
          avatarUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          Alert.alert("Error", "Failed to upload image. Try again.");
          return;
        }
      }

      const payload: UpdateProfilePayload = {
        fullname: form.fullname.trim(),
        email: form.email?.trim() || null,
        gender: form.gender?.trim() || undefined,
        dob: form.dob?.trim() || null,
        address: form.address?.trim() || null,
        licenseplate: form.licenseplate?.trim() || null,
        avatar: avatarUrl || null,
      };

      const response = await axios.put(
        "https://motor-save-be.vercel.app/api/v1/auth/profile",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setForm((prev) => ({
          ...prev,
          avatar: avatarUrl,
        }));

        setIsFormChanged(false);
        setSelectedImage(null);

        // Update params to match new values
        const params = {
          fullname: form.fullname,
          email: form.email,
          gender: form.gender,
          dob: form.dob,
          address: form.address,
          licenseplate: form.licenseplate,
          avatar: avatarUrl,
        };
        router.setParams(params);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });

        Alert.alert(
          "Error",
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to update profile"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      router.replace("/auth/login");
      setTimeout(() => {
        dispatch?.({ type: "LOGOUT" });
        setIsLoggingOut(false);
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  }, [dispatch, router]);

  const GenderOption = ({
    option,
    isSelected,
    onSelect,
  }: {
    option: string;
    isSelected: boolean;
    onSelect: () => void;
  }) => (
    <Pressable
      onPress={onSelect}
      className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl active:bg-gray-100"
    >
      <Text className="text-base font-medium text-gray-900">{option}</Text>
      <Radio value={option}>
        <RadioIndicator>
          <RadioIcon as={CircleIcon} />
        </RadioIndicator>
      </Radio>
    </Pressable>
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      // Format date as YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];
      updateForm({ dob: formattedDate });
    }
  };

  return (
    <Box className="flex-1 bg-gray-50">
      <ScrollView>
        <Box className="bg-blue-600 px-4 pt-6 pb-20 rounded-b-[40px] shadow-lg">
          <Box className="flex-row items-center justify-between mb-6">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft size={24} color="white" />
            </Pressable>

            {isFormChanged && (
              <Pressable onPress={handleSubmit} className="p-2">
                <Text className="text-white font-medium text-lg">Save</Text>
              </Pressable>
            )}
          </Box>

          <Box className="items-center">
            <Box className="relative w-28 h-28">
              <Box className="w-28 h-28 bg-white rounded-full items-center justify-center mb-4 shadow-xl border-4 border-white overflow-hidden">
                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage.uri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : form.avatar ? (
                  <Image
                    source={{ uri: form.avatar }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <User size={48} color="#3B82F6" />
                )}
              </Box>

              <Pressable
                onPress={pickImage}
                className="absolute bottom-0 right-0 w-9 h-9 bg-blue-500 rounded-full items-center justify-center shadow-lg border-2 border-white"
              >
                <Camera size={18} color="white" />
              </Pressable>
            </Box>
          </Box>
        </Box>

        <Box className="px-4 -mt-12">
          <Box className="bg-white rounded-3xl shadow-lg p-5">
            <Box className="space-y-4">
              <Box>
                <Text className="text-sm font-medium text-gray-600 mb-1.5">
                  Full Name
                </Text>
                <Input className="bg-gray-50 rounded-xl border-0 shadow-sm">
                  <InputField
                    value={form.fullname}
                    onChangeText={(text: string) =>
                      updateForm({ fullname: text })
                    }
                    className="h-12 px-3 text-base"
                    placeholder="Enter your full name"
                  />
                </Input>
              </Box>

              <Box>
                <Text className="text-sm font-medium text-gray-600 mb-1.5">
                  Email Address
                </Text>
                <Input className="bg-gray-50 rounded-xl border-0 shadow-sm">
                  <InputField
                    value={form.email || ''}
                    onChangeText={(text: string) => updateForm({ email: text || null })}
                    className="h-12 px-3 text-base"
                    placeholder="Enter your email address (optional)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Input>
              </Box>

              <Box>
                <Text className="text-sm font-medium text-gray-600 mb-1.5">
                  Gender
                </Text>
                <Pressable
                  onPress={() => setShowGenderSheet(true)}
                  className="bg-gray-50 rounded-xl border-0 shadow-sm h-12 px-3 flex-row items-center justify-between"
                >
                  <Text
                    className={`text-base ${form.gender ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {form.gender || "Select your gender (optional)"}
                  </Text>
                  <ChevronDown size={20} color="#9CA3AF" />
                </Pressable>
              </Box>

              <Box>
                <Text className="text-sm font-medium text-gray-600 mb-1.5">
                  Date of Birth
                </Text>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="bg-gray-50 rounded-xl border-0 shadow-sm h-12 px-3 flex-row items-center justify-between"
                >
                  <Text
                    className={`text-base ${form.dob ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {form.dob || "Select your date of birth (optional)"}
                  </Text>
                  <CalendarDaysIcon size={20} color="#9CA3AF" />
                </Pressable>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={form.dob ? new Date(form.dob) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}
              </Box>

              <Box>
                <Text className="text-sm font-medium text-gray-600 mb-1.5">
                  Address
                </Text>
                <Input className="bg-gray-50 rounded-xl border-0 shadow-sm">
                  <InputField
                    value={form.address || ''}
                    onChangeText={(text: string) => updateForm({ address: text || null })}
                    className="h-12 px-3 text-base"
                    placeholder="Enter your address (optional)"
                  />
                </Input>
              </Box>

              <Box>
                <Text className="text-sm font-medium text-gray-600 mb-1.5">
                  License Plate
                </Text>
                <Input className="bg-gray-50 rounded-xl border-0 shadow-sm">
                  <InputField
                    value={form.licenseplate || ''}
                    onChangeText={(text: string) =>
                      updateForm({ licenseplate: text || null })
                    }
                    className="h-12 px-3 text-base"
                    placeholder="Enter license plate number (optional)"
                  />
                </Input>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className="px-4 mt-4 mb-4">
          <Divider className="mb-4" />
          <Button
            onPress={handleLogout}
            disabled={isLoggingOut}
            variant="solid"
            className={`rounded-xl py-2 ${
              isLoggingOut ? 'bg-gray-100' : 'bg-white active:bg-gray-50'
            }`}
          >
            <ButtonText 
              className={`font-medium text-base ${
                isLoggingOut ? 'text-gray-400' : 'text-red-600'
              }`}
            >
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </ButtonText>
          </Button>
        </Box>
      </ScrollView>

      {isLoading && (
        <Box className="absolute inset-0 bg-black/50 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </Box>
      )}

      <Actionsheet
        isOpen={showGenderSheet}
        onClose={() => setShowGenderSheet(false)}
        snapPoints={[45]}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="bg-white rounded-t-3xl p-4">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <Box className="mb-6">
            <Text className="text-xl font-semibold mb-2">
              What's your gender?
            </Text>
            <Text className="text-base text-gray-500">
              This will help us personalise your experience and enhance safety
              features.
            </Text>
          </Box>

          <Box className="w-full">
            <RadioGroup
              value={form.gender || undefined}
              onChange={(value) => {
                updateForm({ gender: value });
                setShowGenderSheet(false);
              }}
            >
              <Box className="space-y-3 w-full">
                {genderOptions.map((option) => (
                  <GenderOption
                    key={option}
                    option={option}
                    isSelected={form.gender === option}
                    onSelect={() => {
                      updateForm({ gender: option });
                      setShowGenderSheet(false);
                    }}
                  />
                ))}
              </Box>
            </RadioGroup>
          </Box>

          <Text className="text-sm text-gray-500 mt-4">
            The provided value may be compared with information that we have of
            you in our records, from time to time.
          </Text>
        </ActionsheetContent>
      </Actionsheet>
    </Box>
  );
}
