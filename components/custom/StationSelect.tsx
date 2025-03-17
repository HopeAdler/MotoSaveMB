import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDownIcon } from "@/components/ui/icon";

// Định nghĩa kiểu dữ liệu cho Station
export interface Station {
  id: string;
  name: string;
  address: string;
  long: string;
  lat: string;
  createddate?: string;
  updateddate?: string;
}

interface StationSelectProps {
  onSelectStation: (station: Station) => void;
}

const StationSelect: React.FC<StationSelectProps> = ({ onSelectStation }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");

  useEffect(() => {
    fetch("https://motor-save-be.vercel.app/api/v1/stations")
      .then((res) => res.json())
      .then((data: Station[]) => {
        setStations(data);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy danh sách station:", error);
        Alert.alert("Lỗi", "Không thể lấy danh sách trạm sửa xe");
      });
  }, []);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    const selectedStation = stations.find((s) => s.id === value);
    if (selectedStation) {
      onSelectStation(selectedStation);
    }
  };

  return (
    <Select
      selectedValue={selectedValue}
      onValueChange={handleValueChange}
      defaultValue=""
    >
      <SelectTrigger variant="outline" size="md">
        <SelectInput placeholder="Chọn trạm sửa xe" />
        <SelectIcon as={ChevronDownIcon} />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          {stations.map((station) => (
            <SelectItem key={station.id} label={station.name} value={station.id} />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  );
};

export default StationSelect;
