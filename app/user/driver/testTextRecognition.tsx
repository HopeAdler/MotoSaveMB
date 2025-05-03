// import { StatusBar } from "expo-status-bar";
// import React, { useState } from "react";
// import {
//   Button,
//   StyleSheet,
//   Text,
//   Image,
//   SafeAreaView,
//   Alert,
//   ScrollView,
//   View,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";

// export default function App() {
//   const [image, setImage] = useState<string | null>(null);
//   const [extractedText, setExtractedText] = useState<string>("");

//   const pickImageGallery = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission denied", "Camera roll permissions are required.");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       base64: false,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       const asset = result.assets[0];
//       setImage(asset.uri);
//       performOCR(asset.uri);
//     }
//   };

//   const pickImageCamera = async () => {
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission denied", "Camera access is required.");
//       return;
//     }

//     const result = await ImagePicker.launchCameraAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       base64: false,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       const asset = result.assets[0];
//       setImage(asset.uri);
//       performOCR(asset.uri);
//     }
//   };

//   const performOCR = async (uri: string) => {
//     try {
//       const formData = new FormData();
//       formData.append("file", {
//         uri,
//         name: "image.jpg",
//         type: "image/jpeg",
//       } as any);

//       const response = await fetch(
//         "https://api.apilayer.com/image_to_text/upload",
//         {
//           method: "POST",
//           headers: {
//             apikey: "FEmvQr5uj99ZUvk3essuYb6P5lLLBS20",
//           },
//           body: formData,
//         }
//       );

//       const result = await response.json();
//       setExtractedText(result["all_text"] || "No text detected.");
//     } catch (error) {
//       console.error("OCR error:", error);
//       Alert.alert("Error", "Failed to extract text from image.");
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white items-center justify-evenly">
//       <ScrollView contentContainerStyle={{ alignItems: "center" }}>
//         <Text className="text-3xl font-bold text-green-600 text-center mb-2">
//           Welcome to GeeksforGeeks
//         </Text>
//         <Text className="text-xl font-bold text-black text-center mb-4">
//           Image to Text App
//         </Text>

//         <View className="mb-2">
//           <Button title="Pick image from gallery" onPress={pickImageGallery} />
//         </View>
//         <View className="mb-4">
//           <Button title="Capture image from camera" onPress={pickImageCamera} />
//         </View>

//         {image && (
//           <Image
//             source={{ uri: image }}
//             className="w-[350px] h-[250px] mb-4 rounded-md"
//             resizeMode="contain"
//           />
//         )}

//         <Text className="text-base font-bold text-black mb-1">
//           Extracted text:
//         </Text>
//         <Text className="text-base text-center px-4 mb-6">{extractedText}</Text>
//       </ScrollView>
//       <StatusBar style="auto" />
//     </SafeAreaView>
//   );
// }
