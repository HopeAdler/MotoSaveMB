import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import React, { useState, useRef, useEffect } from "react";
import * as Location from 'expo-location';

MapboxGL.setAccessToken(
  "pk.eyJ1IjoiaG9wZWFkbGVyIiwiYSI6ImNtNWF4azVlNjR1MGoyanEzdmx4cXJta2IifQ.2D3xCxaGst7iz9zxCwvAhg"
);

interface SearchResult {
  description: string;
  place_id: string;
}

const rescueMap = () => {
  const [loadMap] = useState(
    "https://tiles.goong.io/assets/goong_map_web.json?api_key=kxqBgWA65Rq2Z0K85ZUUFgksN2liNnqprw9BY6DE"
  );
  const [coordinates, setCoordinates] = useState<[number, number]>([
    106.701054, 10.776553,
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  const camera = useRef<MapboxGL.Camera>(null);

  useEffect(() => {
    MapboxGL.setTelemetryEnabled(false);
    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log(location)
      const { longitude, latitude } = location.coords;
      setCoordinates([longitude, latitude]);
      camera.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 12,
        animationDuration: 2000,
      });
    };

    requestLocationPermission();
  }, []);

  // const onDragEnd = (index: number, e: any) => {
  //   const newCoord = e.geometry.coordinates;
  //   setLocations((prevLocations) => {
  //     const updatedLocations = [...prevLocations];
  //     updatedLocations[index] = { ...updatedLocations[index], coord: newCoord };
  //     return updatedLocations;
  //   });
  // };

  const fetchLocationFromGeocoding = async (address: string) => {
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Geocode?address=${encodeURIComponent(
          address
        )}&api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        setSelectedLocation([lng, lat]);
        setSearchResults([]);
        camera.current?.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: 16,
          animationDuration: 1000,
        });
        // setCoordinates([lng, lat]);
      }
    } catch (error) {
      console.error("Error fetching geocode location:", error);
    }
  };

  const searchLocation = async () => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=ukTFcS7AFh3CpfiofJdA6qs3YXWoK9kGwhKgYrQv&input=${searchQuery}`
      );
      const data = await response.json();
      setSearchResults(data.predictions || []);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchLocation();
    }, 1000);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <View className="flex-1">
      <View className="absolute w-full z-10 p-4">
        <TextInput
          placeholder="Search location"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="border p-2 mb-2 rounded bg-white"
        />
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => index.toString()}
          className="bg-white rounded shadow"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery(item.description);
                fetchLocationFromGeocoding(item.description);
              }}
            >
              <Text className="p-2 bg-white">{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View className="flex-1">
        <MapboxGL.MapView
          styleURL={loadMap}
          style={{ height: "100%", width: "100%" }}
          projection="globe"
          zoomEnabled={true}
        >
          <MapboxGL.Camera
            ref={camera}
            zoomLevel={12}
            centerCoordinate={coordinates}
          />
          {selectedLocation && (
            <MapboxGL.PointAnnotation
              id="selected-location"
              coordinate={selectedLocation}
            >
              <MapboxGL.Callout title="Selected Location" />
            </MapboxGL.PointAnnotation>
          )}
        </MapboxGL.MapView>
      </View>
    </View>
  );
};

export default rescueMap;
