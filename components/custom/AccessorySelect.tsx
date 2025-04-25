import { Accessory } from "@/app/context/formFields";
import { formatMoney } from "@/app/utils/utils";
import { ChevronDownIcon } from "@/components/ui/icon";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/components/ui/select";
import React, { useEffect, useState } from "react";

interface AccessorySelectProps {
  acsrOptions: Accessory[];
  onSelectAccessory: (accessory: Accessory) => void;
  selectedAccessory?: string;
}

const AccessorySelect: React.FC<AccessorySelectProps> = ({
  acsrOptions,
  onSelectAccessory,
  selectedAccessory,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(selectedAccessory || "");
  useEffect(() => {
    if (selectedAccessory) {
      setSelectedValue(selectedAccessory);
    }
  }, [selectedAccessory]);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    const selectedOption = acsrOptions.find((acsr) => acsr.id.toString() === value);
    if (selectedOption) {
      onSelectAccessory(selectedOption);
    }
  };
  
  return (
    <Select selectedValue={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger
        variant="outline"
        size="md"
        className="items-start h-auto min-h-[44px] py-2"
      >
        <SelectInput
          placeholder="Chọn linh kiện thay thế"
          className="whitespace-normal break-words flex-wrap h-auto"
          multiline={true}
        />
        <SelectIcon as={ChevronDownIcon} className="mt-1" />
      </SelectTrigger>

      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          {acsrOptions.map((acsr) => (
            <SelectItem key={acsr.accessoryname} label={`${acsr.accessoryname} - ${formatMoney(acsr.cost)}`} value={acsr.id.toString()} />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  );
};

export default AccessorySelect;
