import React, { useState, useEffect, useContext } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { ActivityIndicator } from "react-native";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";
import { ChevronDownIcon, Navigation2, Clock } from "lucide-react-native";
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
import { Divider } from "@/components/ui/divider";
import { AuthContext } from "@/app/context/AuthContext";
import CreateVehicleModal, { Brand } from "@/components/custom/modal/CreateVehicleModal";

// Interface cho customer vehicle theo API hiện tại
export interface CustomerVehicle {
  vehicleid: string;
  brandname: string;
  licenseplate: string;
  customerid: string;
  customername: string;
  stationid?: string | null;
  stationname?: string | null;
  stationaddress?: string | null;
}

interface TripDetailsActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: () => void;
  onCancelSearch?: () => void;
  fare: number | null;
  fareLoading: boolean;
  paymentLoading: boolean;
  isSearching: boolean;
  directionsInfo: any;
  paymentMethodState: [string, React.Dispatch<React.SetStateAction<string>>];
  selectVehicleState: [string, React.Dispatch<React.SetStateAction<string>>];
  confirmDisabled?: boolean;
}

// Hàm định dạng biển số xe (như đã định nghĩa ở modal, có thể tách ra module chung)
const formatLicensePlate = (input: string): string => {
  let cleaned = input.replace(/[^A-Z0-9\-\.]/gi, "").toUpperCase();
  if (!cleaned.includes("-") && cleaned.length > 3) {
    cleaned = cleaned.slice(0, 3) + "-" + cleaned.slice(3);
  }
  if (cleaned.length > 10) {
    cleaned = cleaned.slice(0, 10);
  }
  return cleaned;
};

const TripDetailsActionSheet: React.FC<TripDetailsActionSheetProps> = ({
  isOpen,
  onClose,
  onPayment,
  onCancelSearch,
  fare,
  fareLoading,
  paymentLoading,
  isSearching,
  directionsInfo,
  paymentMethodState: [paymentMethod, setPaymentMethod],
  selectVehicleState: [selectVehicleId, setSelectVehicleId],
}) => {
  const { token } = useContext(AuthContext);

  // State cho xe của customer: sử dụng vehicleid (string)
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<CustomerVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(true);
  const [isCreateVehicleModalOpen, setIsCreateVehicleModalOpen] = useState<boolean>(false);

  // Fetch danh sách brands từ API
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

  // Hàm fetch customer vehicles dựa trên token
  const fetchCustomerVehicles = () => {
    if (!token) return;
    setLoadingVehicles(true);
    fetch("https://motor-save-be.vercel.app/api/v1/customerVehicles/vehicles/customer", {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          return [];
        }
        return res.json();
      })
      .then((data: CustomerVehicle[]) => {
        setCustomerVehicles(data);
        setLoadingVehicles(false);
      })
      .catch((error) => {
        console.error("Error fetching customer vehicles:", error);
        setLoadingVehicles(false);
      });
  };

  useEffect(() => {
    fetchCustomerVehicles();
  }, [token]);

  // Callback khi xe mới được tạo thành công
  const handleVehicleCreated = () => {
    fetchCustomerVehicles();
  };

  // Tính toán label hiển thị cho xe đã chọn dựa trên vehicleid
  const selectedVehicleObj = customerVehicles.find(
    (v) => v.vehicleid === selectedVehicle
  );
  const selectedVehicleLabel = selectedVehicleObj
    ? `${selectedVehicleObj.brandname} - ${formatLicensePlate(selectedVehicleObj.licenseplate)}`
    : "";

  return (
    <>
      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <ActionsheetBackdrop onPress={onClose} />
        <ActionsheetContent className="bg-white rounded-t-3xl">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator className="bg-gray-300 rounded-full w-10 h-1 mx-auto my-2" />
          </ActionsheetDragIndicatorWrapper>

          <Box className="px-6 py-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-center">Trip Details</Text>
          </Box>

          <Box className="p-6">
            {fareLoading ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : (
              <>
                {isSearching ? (
                  <Box className="items-center">
                    <Box className="bg-blue-50 rounded-2xl p-6 w-full items-center">
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text className="text-lg font-semibold text-gray-900 mt-4">
                        Finding nearby drivers...
                      </Text>
                      <Text className="text-gray-600 text-sm mt-2 text-center">
                        Please wait while we connect you with available drivers
                      </Text>
                    </Box>
                    <Button
                      variant="outline"
                      size="lg"
                      onPress={() => {
                        if (onCancelSearch) {
                          onCancelSearch();
                        }
                      }}
                      className="mt-6 w-full border border-red-200 bg-red-50 rounded-xl"
                    >
                      <Box className="flex-row items-center justify-center">
                        <ButtonText className="text-red-600 font-medium">
                          Cancel Search
                        </ButtonText>
                      </Box>
                    </Button>
                  </Box>
                ) : (
                  <>
                    {directionsInfo && (
                      <Box className="bg-gray-50 rounded-2xl p-4">
                        <Box className="flex-row justify-between">
                          <Box className="w-[50%] items-center border-r border-gray-200">
                            <Box className="flex-row items-center">
                              <Clock size={20} color="#4B5563" />
                              <Text className="text-gray-600 ml-2">Duration</Text>
                            </Box>
                            <Text className="text-xl font-bold mt-1">
                              {directionsInfo?.duration?.text}
                            </Text>
                          </Box>
                          <Box className="w-[50%] items-center">
                            <Box className="flex-row items-center">
                              <Navigation2 size={20} color="#4B5563" />
                              <Text className="text-gray-600 ml-2">Distance</Text>
                            </Box>
                            <Text className="text-xl font-bold mt-1">
                              {directionsInfo?.distance?.text}
                            </Text>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    <Box className="bg-blue-50 rounded-2xl p-4 mt-4">
                      <Box className="items-center">
                        <Text className="text-gray-600 mb-1">Estimated Fare</Text>
                        <Text className="text-2xl font-bold text-blue-600">
                          {fare?.toLocaleString()} VND
                        </Text>
                      </Box>
                    </Box>
                    <Box className="mt-4">
                      <Text className="text-gray-600 mb-2">Payment Method</Text>
                      <Select
                        selectedValue={paymentMethod}
                        onValueChange={(value: any) => setPaymentMethod(value)}
                      >
                        <SelectTrigger className="border border-gray-200 rounded-xl p-5 flex-row items-center justify-between bg-gray-50 h-13">
                          <SelectInput
                            placeholder="Select payment method"
                            className="text-lg flex-1"
                          />
                          <SelectIcon as={ChevronDownIcon} />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectBackdrop />
                          <SelectContent>
                            <SelectItem label="Tiền mặt" value="Tiền mặt" />
                            <SelectItem label="Zalopay" value="Zalopay" />
                          </SelectContent>
                        </SelectPortal>
                      </Select>
                    </Box>
                    <Box className="mt-4">
                      <Text className="text-gray-600 mb-2">Loại xe</Text>
                      {loadingVehicles ? (
                        <ActivityIndicator size="small" color="#3B82F6" />
                      ) : (
                        <Select
                          selectedValue={selectedVehicle}
                          onValueChange={(value: any) => {
                            if (value === "create-new") {
                              setIsCreateVehicleModalOpen(true);
                              setSelectedVehicle("");
                            } else {
                              setSelectedVehicle(value);
                              setSelectVehicleId(value)
                            }
                          }}
                        >
                          <SelectTrigger className="border border-gray-200 rounded-xl p-5 flex-row items-center justify-between bg-gray-50 h-13">
                            <SelectInput
                              placeholder="Chọn xe của bạn"
                              className="text-lg flex-1"
                              value={selectedVehicleLabel}
                            />
                            <SelectIcon as={ChevronDownIcon} />
                          </SelectTrigger>
                          <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                              {customerVehicles.length > 0 ? (
                                customerVehicles.map((vehicle) => {
                                  const label = `${vehicle.brandname} - ${formatLicensePlate(vehicle.licenseplate)}`;
                                  return (
                                    <SelectItem
                                      key={vehicle.vehicleid}
                                      label={label}
                                      value={vehicle.vehicleid}
                                    />
                                  );
                                })
                              ) : (
                                <SelectItem label="Không có xe nào" value="" isDisabled />
                              )}
                              <Divider className="my-2" />
                              <SelectItem label="Tạo xe mới" value="create-new" />
                            </SelectContent>
                          </SelectPortal>
                        </Select>
                      )}
                    </Box>
                    <Button
                      variant="solid"
                      size="lg"
                      onPress={onPayment}
                      disabled={fareLoading || paymentLoading || fare === null}
                      className="bg-blue-600 h-14 rounded-xl mt-4"
                    >
                      <Box className="flex-row items-center">
                        {paymentLoading && (
                          <ActivityIndicator size="small" color="white" />
                        )}
                        <ButtonText className="text-lg font-semibold ml-2">
                          {paymentLoading ? "Processing..." : "Confirm Booking"}
                        </ButtonText>
                      </Box>
                    </Button>
                  </>
                )}
              </>
            )}
          </Box>
        </ActionsheetContent>
      </Actionsheet>

      {/* Modal tạo xe mới được render bên ngoài Actionsheet */}
      <CreateVehicleModal
        isOpen={isCreateVehicleModalOpen}
        onClose={() => setIsCreateVehicleModalOpen(false)}
        brands={brands}
        onVehicleCreated={handleVehicleCreated}
      />
    </>
  );
};

export default TripDetailsActionSheet;
