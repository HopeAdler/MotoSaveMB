import React, { useEffect, useState } from "react";
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
import { formatMoney } from "@/app/utils/utils";

interface RepairCostPreview {
  id: string,
  name: string;
  description: string,
  min: number;
  max: number;
}

interface RepairSelectProps {
  repairOptions: RepairCostPreview[];
  onSelectRepair: (repair: RepairCostPreview) => void;
  selectedRepair?: string;
}

const RepairCostPreviewSelect: React.FC<RepairSelectProps> = ({
  repairOptions,
  onSelectRepair,
  selectedRepair,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(selectedRepair || "");
  const [accessories, setAccessories] = useState<RepairCostPreview[]>([]);
  useEffect(() => {
    if (selectedRepair) {
      setSelectedValue(selectedRepair);
    }
  }, [selectedRepair]);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    const selectedOption = repairOptions.find((repair) => repair.name === value);
    if (selectedOption) {
      onSelectRepair(selectedOption);
    }
  };

  useEffect(() => {
    console.log(selectedValue)
  }, [repairOptions]);
  return (
    <Select selectedValue={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger
        variant="outline"
        size="md"
        className="items-start h-auto min-h-[44px] py-2"
      >
        <SelectInput
          placeholder="Chọn hạng mục sửa chữa"
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
          {repairOptions.map((repair) => (
            <SelectItem key={repair.name} label={`${repair.name} (${formatMoney(repair.min)} ~ ${formatMoney(repair.max)})`} value={repair.name} />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  );
};

export default RepairCostPreviewSelect;
