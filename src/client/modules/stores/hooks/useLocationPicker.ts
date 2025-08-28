'use client';

import { useState } from 'react';

interface UseLocationPickerProps {
    lat?: number | string;
    lng?: number | string;
    onLocationSelect: (lat: number, lng: number) => void;
}

export function useLocationPicker({ lat, lng, onLocationSelect }: UseLocationPickerProps) {
    const [mapCenter, setMapCenter] = useState({
        lat: parseFloat(lat as string) || 40.7128,
        lng: parseFloat(lng as string) || -74.0060,
    });

    const handleMapClick = (location: { lat: number; lng: number; name?: string }) => {
        setMapCenter({ lat: location.lat, lng: location.lng });
        onLocationSelect(location.lat, location.lng);
    };

    return {
        mapCenter,
        handleMapClick,
    };
}