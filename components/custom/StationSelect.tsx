import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { getDistance } from "geolib";
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
  currentLocation?: { latitude: number; longitude: number };
  maxDistance?: number; // khoảng cách tối đa phục vụ
  stations: Station[];
  selectedStationId: string;
}

const StationSelect: React.FC<StationSelectProps> = ({
  onSelectStation,
  currentLocation,
  maxDistance,
  stations,
  selectedStationId,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>("");

  // Sắp xếp các station dựa trên khoảng cách từ currentLocation
  let sortedStations = stations;
  if (currentLocation && stations.length > 0) {
    sortedStations = stations.slice().sort((a, b) => {
      const distanceA = getDistance(currentLocation, {
        latitude: parseFloat(a.lat),
        longitude: parseFloat(a.long),
      });
      const distanceB = getDistance(currentLocation, {
        latitude: parseFloat(b.lat),
        longitude: parseFloat(b.long),
      });
      return distanceA - distanceB;
    });
    if (maxDistance) {
      sortedStations = sortedStations.filter((station) => {
        const distance = getDistance(currentLocation, {
          latitude: parseFloat(station.lat),
          longitude: parseFloat(station.long),
        });
        return distance <= maxDistance;
      });
    }
  }

  // Nếu selectedStationId có giá trị, cập nhật selectedValue
  useEffect(() => {
    if (selectedStationId) {
      setSelectedValue(selectedStationId);
    }
  }, [selectedStationId]);

  // Tính nhãn hiển thị dựa trên selectedStationId
  let selectedLabel= "";
  if (selectedValue && currentLocation) {
    const sel = stations.find((s) => s.id === selectedValue);
    if (sel) {
      const distance = getDistance(currentLocation, {
        latitude: parseFloat(sel.lat),
        longitude: parseFloat(sel.long),
      });
      selectedLabel = sel.name + ` (${(distance / 1000).toFixed(1)} km)`;
    }
  }

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    const selectedStation = stations.find((s) => s.id === value);
    if (selectedStation) {
      onSelectStation(selectedStation);
    }
  };

  return (
    <Select
      selectedValue={selectedLabel}
      onValueChange={handleValueChange}
      // defaultValue={selectedLabel}
      // initialLabel={selectedLabel}
    >
      <SelectTrigger variant="outline" size="md" className="p-3 border border-gray-200 flex-row items-center justify-between h-12">
        <SelectInput placeholder="Chọn trạm sửa xe"/>
        <SelectIcon as={ChevronDownIcon} />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          {sortedStations.map((station) => {
            let label = station.name;
            if (currentLocation) {
              const distance = getDistance(currentLocation, {
                latitude: parseFloat(station.lat),
                longitude: parseFloat(station.long),
              });
              label += ` (${(distance / 1000).toFixed(1)} km)`;
            }
            return (
              <SelectItem key={station.id} label={label} value={station.id} />
            );
          })}
        </SelectContent>
      </SelectPortal>
    </Select>
  );
};

export default StationSelect;
