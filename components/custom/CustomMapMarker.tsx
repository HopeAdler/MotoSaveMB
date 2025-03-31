import React from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pin, MapPin, Cog } from "lucide-react-native";
import { Station } from "@/components/custom/StationSelect";
import { getDistance } from "geolib";
import MapboxGL from "@rnmapbox/maps";

interface MarkerProps {
    size?: number;
    label?: string;
    showDistance?: boolean;
    distance?: number;
}

export const OriginMarker = ({ size = 28 }: MarkerProps) => (
    <Box className="items-center justify-center">
        <Box className="items-center">
            {/* Shadow effect for 3D appearance */}
            <Box className="absolute -bottom-1 opacity-40 rounded-full bg-black w-6 h-1.5" />
            <Pin
                color="#374151"
                size={size}
                absoluteStrokeWidth
                fill="#3B82F6"
                scale={0.9}
            />
            {/* Highlight effect */}
            <Box className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white opacity-50" />
        </Box>
    </Box>
);

export const DestinationMarker = ({ size = 28 }: MarkerProps) => (
    <Box className="items-center justify-center">
        <Box className="items-center">
            {/* Shadow effect for 3D appearance */}
            <Box className="absolute -bottom-1 opacity-40 rounded-full bg-black w-6 h-1.5" />
            <MapPin
                color="#374151"
                size={size}
                absoluteStrokeWidth
                fill="#F87171"
                scale={0.9}
            />
            {/* Highlight effect */}
            {/* <Box className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white opacity-50" /> */}
        </Box>
    </Box>
);


export const StationMarker = ({ size = 28, label, showDistance, distance }: MarkerProps) => (
    <Box className="items-center justify-center">
        <Box className="items-center px-2 py-0.5 rounded-full mt-1 shadow-sm">
            {/* Shadow effect for 3D appearance */}
            <Box className="rounded-full bg-white p-1 shadow-md">
                <Cog
                    color="#000000"
                    size={size}
                    absoluteStrokeWidth
                    fill="#DBEAFE"
                />
                {/* <Box className="absolute -bottom-1 opacity-40 rounded-full bg-black w-6 h-1.5" /> */}
            </Box>
            {/* Highlight effect */}
            {/* <Box className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white opacity-50" /> */}
            {showDistance && distance && (
                <Box className="bg-white px-2 py-0.5 rounded-full mt-1 shadow-sm">
                    <Box className="absolute -bottom-1 opacity-40 rounded-full bg-black w-6 h-1.5" />
                    <Text className="text-xs font-medium text-gray-700">{(distance / 1000).toFixed(1)} km</Text>
                </Box>
            )}
        </Box>
    </Box>
);



export const renderStationMarkers = (stations: Station[], currentLoc: { latitude: number, longitude: number }, serviceRadius: number) => {
    if (!stations || stations.length === 0) return null;

    return stations
        .filter(station => {
            if (currentLoc.latitude === 0 && currentLoc.longitude === 0) return false;
            const distance = getDistance(currentLoc, {
                latitude: parseFloat(station.lat),
                longitude: parseFloat(station.long),
            });
            return distance <= serviceRadius;
        })
        .map(station => {
            const distance = getDistance(currentLoc, {
                latitude: parseFloat(station.lat),
                longitude: parseFloat(station.long),
            });

            return (

                <MapboxGL.PointAnnotation
                    id={`station-${station.id}`}
                    key={station.id}
                    coordinate={[parseFloat(station.long), parseFloat(station.lat)]}
                >
                    <StationMarker
                        label={station.name}
                        showDistance={true}
                        distance={distance}
                    />
                    <MapboxGL.Callout title={station.name} />
                </MapboxGL.PointAnnotation>

            );
        });
};