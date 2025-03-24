import React from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input, InputField, InputIcon } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { ChevronLeft, ChevronUp, Search, MapPin, X } from "lucide-react-native";
import { FlatList } from "react-native";

// Back button component
export const BackButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-md"
  >
    <ChevronLeft size={24} color="#374151" />
  </Pressable>
);

// Enhanced search input
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput = ({ 
  value, 
  onChangeText, 
  placeholder,
  onClear,
  showClearButton = true
}: SearchInputProps) => (
  <Input 
    variant="outline" 
    size="md" 
    className="bg-white rounded-xl shadow-sm border-0"
  >
    <InputIcon>
      <Search size={18} color="#6B7280" />
    </InputIcon>
    <InputField
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
    />
    {showClearButton && value.length > 0 && (
      <Pressable onPress={onClear} className="p-2">
        <X size={16} color="#6B7280" />
      </Pressable>
    )}
  </Input>
);

// Search results component
interface SearchResultsProps {
  data: any[];
  onSelectItem: (item: any) => void;
  visible: boolean;
}

export const SearchResults = ({ data, onSelectItem, visible }: SearchResultsProps) => {
  if (!visible || data.length === 0) return null;
  
  return (
    <Box className="bg-white rounded-lg shadow-md max-h-40 mt-1 z-50">
      <FlatList
        data={data}
        keyExtractor={(_item, index) => index.toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectItem(item)}
            className="p-3 border-b border-gray-100 flex-row items-center"
          >
            <MapPin size={16} color="#6B7280" className="mr-2" />
            <Text className="text-gray-800 ml-2">{item.description}</Text>
          </Pressable>
        )}
      />
    </Box>
  );
};

// Action button component
interface ActionButtonProps {
  onPress: () => void;
  visible: boolean;
  icon: React.ReactNode;
}

export const FloatingActionButton = ({ onPress, visible, icon }: ActionButtonProps) => {
  if (!visible) return null;
  
  return (
    <Pressable
      onPress={onPress}
      className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-md"
    >
      {icon}
    </Pressable>
  );
};

// Renders the toggle button for actionsheets
export const ActionSheetToggle = ({ onPress, visible }: { onPress: () => void, visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-20 right-4 w-12 h-12 bg-white rounded-full items-center justify-center shadow-md"
    >
      <ChevronUp size={24} color="#3B82F6" />
    </Pressable>
  );
};