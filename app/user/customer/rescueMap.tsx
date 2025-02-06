import { Box } from "@/components/ui/box";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import React, { useState, useRef, useEffect } from "react";

MapboxGL.setAccessToken("pk.eyJ1IjoiaG9wZWFkbGVyIiwiYSI6ImNtNWF4azVlNjR1MGoyanEzdmx4cXJta2IifQ.2D3xCxaGst7iz9zxCwvAhg");

interface SearchResult {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}


const rescueMap = () => {
  const [loadMap] = useState(
    "https://tiles.goong.io/assets/goong_map_web.json?api_key=kxqBgWA65Rq2Z0K85ZUUFgksN2liNnqprw9BY6DE"
  );
  const [coordinates, setCoordinates] = useState<[number, number]>([105.83991, 21.028]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [locations, setLocations] = useState([
    { coord: [105.83991, 21.028], name: "Hanoi" },
    { coord: [105.84117, 21.0238], name: "Point 2" },
    { coord: [105.8345, 21.0308], name: "Point 3" },
  ]);

  const camera = useRef(null);

  useEffect(() => {
    MapboxGL.setTelemetryEnabled(false);
  }, []);

  const onDragEnd = (index: number, e: any) => {
    const newCoord = e.geometry.coordinates;
    setLocations((prevLocations) => {
      const updatedLocations = [...prevLocations];
      updatedLocations[index] = { ...updatedLocations[index], coord: newCoord };
      return updatedLocations;
    });
  };

  useEffect(() => {
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
    
    searchLocation();
  }, [searchQuery]);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <TextInput
        placeholder="Search location"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
      />
      <FlatList
        data={searchResults}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              // setCoordinates([item.geometry.location.lng, item.geometry.location.lat]);
              // setSearchResults([]);
              setSearchQuery(item.description)
            }}
          >
            <Text style={{ padding: 10, backgroundColor: '#f0f0f0', marginBottom: 5 }}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
      <MapboxGL.MapView
        styleURL={loadMap}
        style={{ flex: 1 }}
        projection="globe"
        zoomEnabled={true}
      >
        <MapboxGL.Camera
          ref={camera}
          zoomLevel={12}
          centerCoordinate={coordinates}
        />

        {locations.map((item, index) => (
          <MapboxGL.PointAnnotation
            id={`pointID-${index}`} 
            key={`pointKey-${index}`}
            coordinate={item.coord}
            draggable={true}
            onDragEnd={(e) => onDragEnd(index, e)}
          >
            <MapboxGL.Callout title={item.name} />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
    </View>
  );
}

export default rescueMap