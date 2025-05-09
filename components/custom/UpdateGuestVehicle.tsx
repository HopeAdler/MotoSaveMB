import React, { useState, useContext, useEffect } from "react";
import { Alert } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
} from "@/components/ui/form-control";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDownIcon } from "lucide-react-native";
import { AuthContext } from "@/app/context/AuthContext";
import { updateRequestVehicle } from "@/app/services/beAPI";

export interface Brand {
  id: number;
  name: string;
}

// Helper function để định dạng biển số xe theo tiêu chuẩn Việt Nam
const formatLicensePlate = (input: string): string => {
  let cleaned = input.replace(/[^A-Z0-9\-\.]/gi, "").toUpperCase();
  // Nếu chưa có dấu gạch ngang và độ dài > 3, chèn sau 3 ký tự
  if (!cleaned.includes("-") && cleaned.length > 4) {
    cleaned = cleaned.slice(0, 4) + "-" + cleaned.slice(4);
  }
  // Giới hạn độ dài tối đa (ví dụ: 10 ký tự)
  if (cleaned.length > 10) {
    cleaned = cleaned.slice(0, 10);
  }
  return cleaned;
};

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

const UpdateGuestVehicle: React.FC<CreateVehicleModalProps> = ({
  isOpen,
  onClose,
  requestId,
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetch("https://motor-save-be.vercel.app/api/v1/brands")
      .then((res) => res.json())
      .then((data: Brand[]) => {
        setBrands(data);
      })
      .catch((error) => {
        console.error("Error fetching brands:", error);
      });
  }, []);

  // Khi người dùng nhập vào, tự động format và validate
  const handleLicensePlateChange = (text: string) => {
    const formatted = formatLicensePlate(text);
    setLicensePlate(formatted);
    // Ví dụ: yêu cầu tối thiểu 6 ký tự
    if (formatted.length < 9) {
      setIsInvalid(true);
    } else {
      setIsInvalid(false);
    }
  };

  const handleCreateVehicle = async () => {
    if (!selectedBrand || !licensePlate || licensePlate.length < 9) {
      Alert.alert("Error", "Thương hiệu và biển số xe hợp lệ là bắt buộc.");
      return;
    }
    Alert.alert(
      "Confirm Create Vehicle",
      `Bạn có chắc muốn tạo xe?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: async () => {
            try {
              const response = await fetch(
                "https://motor-save-be.vercel.app/api/v1/customerVehicles/guest",
                {
                  method: "POST",
                  headers: {
                    Accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    licensePlate: licensePlate, // đã được format
                    brandId: parseInt(selectedBrand, 10),
                  }),
                }
              );
              if (!response.ok) {
                const errorData = await response.json();
                Alert.alert(
                  "Error",
                  errorData.message || "Có lỗi xảy ra khi tạo xe."
                );
                return;
              }
              const result = await response.json();
              console.log(result.id);
              const updateVehicle = await updateRequestVehicle(
                requestId,
                result.id,
                token
              );
              console.log(updateVehicle);
              Alert.alert("Success", "Xe đã được cập nhật thành công.");
              onClose();
              // Reset form
              setSelectedBrand("");
              setLicensePlate("");
            } catch (error) {
              console.error("Error creating vehicle:", error);
              Alert.alert("Error", "Có lỗi xảy ra, vui lòng thử lại sau.");
            }
          },
        },
      ]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="md" className="text-typography-950">
            Tạo xe mới
          </Heading>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          <FormControl isInvalid={false} isRequired>
            <FormControlLabel>
              <FormControlLabelText size="lg">
                Chọn thương hiệu xe
              </FormControlLabelText>
            </FormControlLabel>
            <Select
              selectedValue={selectedBrand}
              onValueChange={(value) => setSelectedBrand(value)}
            >
              <SelectTrigger
                className="border border-gray-200 rounded-xl p-3 flex-row items-center justify-between bg-gray-50"
                size="xl"
              >
                <SelectInput placeholder="Chọn thương hiệu" />
                <SelectIcon as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem
                      key={brand.id}
                      label={brand.name}
                      value={brand.id.toString()}
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </FormControl>
          <FormControl isInvalid={isInvalid} isRequired className="mt-4">
            <FormControlLabel>
              <FormControlLabelText size="lg">Biển số xe</FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="xl">
              <InputField
                placeholder="Nhập biển số xe"
                value={licensePlate}
                onChangeText={handleLicensePlateChange}
                onBlur={() => setLicensePlate(formatLicensePlate(licensePlate))}
              />
            </Input>
            <FormControlHelper>
              <FormControlHelperText>
                Biển số xe phải có ít nhất 9 ký tự.
              </FormControlHelperText>
            </FormControlHelper>
            {isInvalid && (
              <FormControlError>
                <FormControlErrorText>
                  Biển số xe không hợp lệ.
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onPress={onClose}>
            <ButtonText>Huỷ</ButtonText>
          </Button>
          <Button onPress={handleCreateVehicle}>
            <ButtonText>Tạo</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateGuestVehicle;
