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

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.navigate("/onboard");
      // return <Redirect href='/onboard/index' />
    }, 2000); // Chuyển tới Onboard Screen sau 2 giây
  }, [router]);

  return (
    <Box className='flex-1 justify-center items-center'>
      <Text bold size='2xl'>
        Welcome to My App bitches
        This is SplashScreen
      </Text>
    </Box>
  );
}



