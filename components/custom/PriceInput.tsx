import React, { memo } from "react";
import { TextInput } from "react-native";

interface PriceInputProps {
  item: {
    index: number;
    cost: number;
    min?: number;
    max?: number;
  };
  onPriceChange: (index: number, costStr: string) => void;
  onBlur: (index: number) => void;
}

const PriceInput = memo(({ item, onPriceChange, onBlur }: PriceInputProps) => {
  return (
    <TextInput
      className={`flex-1 bg-white p-4 rounded-xl text-base mr-3 ${
        item.min &&
        item.max &&
        (item.cost < item.min || item.cost > item.max)
          ? "border-2 border-red-500"
          : "border border-gray-200"
      }`}
      placeholder="Enter price"
      keyboardType="numeric"
      value={item.cost === 0 ? "" : item.cost.toString()}
      onChangeText={(text) => onPriceChange(item.index, text)}
      onBlur={() => onBlur(item.index)}
    />
  );
});

export default PriceInput;
