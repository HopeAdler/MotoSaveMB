import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending": return "bg-yellow-100 text-yellow-700";
    case "Accepted": return "bg-blue-100 text-blue-700";
    case "Processing": return "bg-purple-100 text-purple-700";
    case "Done": return "bg-green-100 text-green-700";
    case "Cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'large' | 'banner';
}

export const StatusBadge = ({ status, variant = 'default' }: StatusBadgeProps) => {
  const baseStyles = getStatusColor(status);
  const sizeStyles = variant === 'large' 
    ? 'px-4 py-2 text-base' 
    : variant === 'banner'
    ? 'w-full py-2 text-base'
    : 'px-3 py-1 text-sm';

  return (
    <Box className={`rounded-full ${baseStyles} ${sizeStyles}`}>
      <Text className="font-medium text-center">
        {status}
      </Text>
    </Box>
  );
};