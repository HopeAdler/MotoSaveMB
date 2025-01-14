// import { Box } from "@/components/ui/box";
// import { Text, View } from "react-native";
// import MapboxGL from "@rnmapbox/maps";
// import React, { useState, useRef, useEffect } from "react";

// MapboxGL.setAccessToken("pk.eyJ1IjoiaG9wZWFkbGVyIiwiYSI6ImNtNWF4azVlNjR1MGoyanEzdmx4cXJta2IifQ.2D3xCxaGst7iz9zxCwvAhg");

// const Index = () => {
//   const [loadMap] = useState(
//     "https://tiles.goong.io/assets/goong_map_web.json?api_key=kxqBgWA65Rq2Z0K85ZUUFgksN2liNnqprw9BY6DE"
//   );
//   const [coordinates] = useState([105.83991, 21.028]); // [Longitude, Latitude]

//   const [locations] = useState([
//     { coord: [105.83991, 21.028], name: "Hanoi" },
//     { coord: [105.84117, 21.0238], name: "Point 2" },
//     { coord: [105.8345, 21.0308], name: "Point 3" },
//   ]);

//   const camera = useRef(null);

//   useEffect(() => {
//     MapboxGL.setTelemetryEnabled(false);
//   }, []);

//   return (
//     <View style={{ flex: 1 }}>
//       <MapboxGL.MapView
//         styleURL={loadMap}
//         style={{ flex: 1 }}
//         projection="globe"
//         zoomEnabled={true}
//       >
//         <MapboxGL.Camera
//           ref={camera}
//           zoomLevel={12}
//           centerCoordinate={coordinates}
//         />

//         {locations.map((item, index) => (
//           <MapboxGL.PointAnnotation
//             id={`pointID-${index}`} 
//             key={`pointKey-${index}`}
//             coordinate={item.coord}
//             draggable={true}
//           >
//             <MapboxGL.Callout title={item.name} />
//           </MapboxGL.PointAnnotation>
//         ))}
//       </MapboxGL.MapView>
//     </View>
//   );
// };
// export default Index;


//MAP comment trên đây, cần thì copy này paste qua bên khác 
// Đây là trang splashscreen là trang đầu trong cái app, 
//như cramata trang icon ấy


import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from './loading/loading';

export default function SplashScreen() {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);  // Trạng thái loading để điều khiển thời gian đợi

  useEffect(() => {
    // Hàm kiểm tra dữ liệu user và token
    const checkUserData = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser);
        // Nếu có token và user, chuyển tới home theo role
        switch (user.role) {
          case "Customer":
            router.navigate("/user/customer/home");
            break;
          case "Driver":
            router.navigate("/user/driver/home");
            break;
          case "Mechanic":
            router.navigate("/user/mechanic/home");
            break;
          default:
            router.navigate("/error/404"); // Hoặc một màn hình lỗi nếu cần
            break;
        }
      } else {
        // Nếu không có user và token, qua onboard
        router.navigate("/onboard");
      }
    };

    // Đặt setTimeout để delay 3 giây trước khi gọi checkUserData
    const timeout = setTimeout(() => {
      checkUserData();
      setLoading(true);  // Thay đổi trạng thái để cho phép chuyển hướng
    }, 5000);  // Đợi 3 giây (3000ms)

    // Cleanup khi component bị unmount để tránh gọi lại setTimeout
    return () => clearTimeout(timeout);

  }, [router]);


  if (isLoading) {
    return (
      <LoadingScreen />
    );
  }

  return (
    <Box className='flex-1 justify-center items-center'>
      <Text bold size='2xl'>
        Welcome to My App Bitches
        This is SplashScreen
      </Text>
    </Box>
  );
}
