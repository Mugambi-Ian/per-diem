'use client';

import React from 'react';
import {MapPin} from 'lucide-react';
import Map from "@/client/shared/components/map";
import { useLocationPicker } from '../hooks/useLocationPicker';

export interface MapViewProps {
    lat?: number | string;
    lng?: number | string;
    address?: string;
    onLocationSelect: (lat: number, lng: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({ lat, lng, onLocationSelect, address }) => {
    const { mapCenter, handleMapClick } = useLocationPicker({ lat, lng, onLocationSelect });

    return (
        <div className="relative w-full">
            <Map
                center={mapCenter}
                zoom={14}
                className="rounded-xl border border-gray-200 dark:border-gray-700 cursor-crosshair"
                height="320px"
                onMarkerClick={handleMapClick}
                onMapClick={handleMapClick}
            />

            <div className="absolute top-3 right-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-gray-700 dark:text-gray-300 shadow-md">
                Click to set location
            </div>

            <div className="mt-3 text-center">
                <MapPin className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                </p>
                {address && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{address}</p>
                )}
            </div>
        </div>
    );
};

export default MapView;


