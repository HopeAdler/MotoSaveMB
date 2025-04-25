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
import { Accessory, RepairCostPreview } from "@/app/context/formFields";
import AccessorySelect from "./AccessorySelect";
import { getAcsrByBrandAndParCat } from "@/app/services/beAPI";
import { Text, View } from "react-native";

interface RepairSelectProps {
  brandId: number;
  repairOptions: RepairCostPreview[];
  onSelectRepair: (
    repair: RepairCostPreview,
    accessory?: Accessory,
    wage?: number,
    total?: number
  ) => void;
  selectedRepair?: string;
}

const RepairCostPreviewSelect: React.FC<RepairSelectProps> = ({
  brandId,
  repairOptions,
  onSelectRepair,
  selectedRepair,
}) => {
  const [selectedRepairOption, setSelectedRepairOption] = useState<RepairCostPreview | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>(selectedRepair || "");
  const [selectedParCatId, setSelectedParCatId] = useState<number>();
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [rate, setRate] = useState<number>(0);
  const [wage, setWage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  // sync controlled repair selection
  useEffect(() => {
    if (selectedRepair) {
      setSelectedValue(selectedRepair);
    }
  }, [selectedRepair]);

  // when repair changes, fetch accessories
  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        if (!selectedParCatId) return;
        const results = await getAcsrByBrandAndParCat(selectedParCatId, brandId);
        if (results) setAccessories(results);
      } catch (error) {
        console.error("Error fetching accessories:", error);
      }
    };
    fetchAccessories();
    // reset accessory selection when parCat changes
    setSelectedAccessory(null);
  }, [selectedParCatId, brandId]);

  const handleRepairChange = (value: string) => {
    setSelectedValue(value);
    const selectedOption = repairOptions.find((r) => r.name === value);
    if (selectedOption) {
      setSelectedRepairOption(selectedOption);
      onSelectRepair(selectedOption);
      setRate(selectedOption.rate);
      setWage(selectedOption.wage);
      setTotal(selectedOption.wage);
      setSelectedParCatId(selectedOption.partcategoryid);
    }
  };

  const handleAccessoryChange = (accessory: Accessory) => {
    setSelectedAccessory(accessory);

    // find your RepairCostPreview
    const sel = selectedRepairOption;
    if (!sel) return console.warn("no repair selected!");

    // compute from the just-passed accessory and current rate
    const wage = accessory.cost * rate;
    const total = accessory.cost + wage;

    console.log("wage, total:", wage, total);

    // update UI state
    setWage(wage);
    setTotal(total);

    // now fire the parent callback with all four values
    onSelectRepair(sel, accessory, wage, total);
  };

  return (
    <>
      <Select selectedValue={selectedValue} onValueChange={handleRepairChange}>
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
              <SelectItem
                key={repair.name}
                label={`${repair.name} (${formatMoney(repair.min)} ~ ${formatMoney(
                  repair.max
                )})`}
                value={repair.name}
              />
            ))}
          </SelectContent>
        </SelectPortal>
      </Select>

      {selectedParCatId && (
        <AccessorySelect
          acsrOptions={accessories}
          selectedAccessory={selectedAccessory?.accessoryname}
          onSelectAccessory={handleAccessoryChange}
        />

      )}
      <View className="flex-row flex-wrap gap-2 mt-4">
        {selectedAccessory && (
          <Text className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            Rate: {rate}x
          </Text>
        )}
        <Text className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
          Wage: {formatMoney(wage)}
        </Text>
        <Text className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
          Total: {formatMoney(total)}
        </Text>
      </View>

    </>
  );
};

export default RepairCostPreviewSelect;
