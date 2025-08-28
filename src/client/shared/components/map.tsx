'use client';

import React, { useRef } from 'react';
import { useLeafletMap } from '../hooks/useLeafletMap';

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface MapProps {
  center: Location;
  markers?: Location[];
  zoom?: number;
  className?: string;
  height?: string;
  onMarkerClick?: (location: Location) => void;
  onMapClick?: (location: Location) => void;
}

export const Map: React.FC<MapProps> = ({
                                          center,
                                          markers = [],
                                          zoom = 13,
                                          className = '',
                                          height = '400px',
                                          onMarkerClick,
                                          onMapClick,
                                        }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useLeafletMap({ mapRef, center, markers, zoom, onMarkerClick, onMapClick });

  return (
      <div
          ref={mapRef}
          className={`w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}
          style={{ height }}
      />
  );
};

export default Map;
