import AuthContext from "@/app/context/AuthContext";
import { createFeedback, Feedback } from "@/app/services/beAPI";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { Star } from "lucide-react-native";
import { useContext, useState } from "react";
import { TouchableOpacity } from "react-native";

const FeedbackScreen = () => {
  const { token } = useContext(AuthContext);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { requestdetailid } = useLocalSearchParams<{
    requestdetailid: string;
  }>();

  const handleSubmit = async () => {
    const payload: Feedback = {
      rating: rating,
      comment: comment,
    };
    try {
      const result = await createFeedback(requestdetailid, payload, token);
      console.log(result);
      alert("Create feedback success!")
      router.navigate("/user/customer/home/homepage")
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  return (
    <Box className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-center">
        Your feedback make will improve our service
      </Text>
      {/* Star Rating */}
      <Box className="flex-row my-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Star
              size={64}
              color={star <= rating ? "#facc15" : "#d1d5db"}
              fill={star <= rating ? "#facc15" : "none"}
              className="mx-1"
            />
          </TouchableOpacity>
        ))}
      </Box>

      {/* Comment Input */}
      <Input className="w-full border border-gray-300 rounded-xl px-4 py-3 my-4 h-40">
        <InputField
          placeholder="Write your review here..."
          value={comment}
          onChangeText={setComment}
          className="text-gray-700 text-lg"
        />
      </Input>

      {/* Submit Button */}
      <Button
        className="w-full bg-green-500 rounded-xl p-2 mt-4"
        onPress={handleSubmit}
      >
        <ButtonText className="text-white text-lg">Submit</ButtonText>
      </Button>
      <Button
        className="w-full bg-red-500 rounded-xl p-2 mt-4"
        onPress={() => router.navigate("/user/customer/home/homepage")}
      >
        <ButtonText className="text-white text-lg">Cancel</ButtonText>
      </Button>
    </Box>
  );
};

export default FeedbackScreen;
