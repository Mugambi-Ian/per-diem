'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS directly

interface Location {
    lat: number;
    lng: number;
    name?: string;
}

interface UseLeafletMapProps {
    mapRef: React.RefObject<HTMLDivElement | null>;
    center: Location;
    markers?: Location[];
    zoom?: number;
    onMarkerClick?: (location: Location) => void;
    onMapClick?: (location: Location) => void;
}

export function useLeafletMap({ mapRef, center, markers = [], zoom = 13, onMarkerClick, onMapClick }: UseLeafletMapProps) {
    const mapInstanceRef = useRef<any>(null);
    const currentMarkerRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const loadMap = async () => {
            const L = await import('leaflet');

            // Clean previous map if re-initialized
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }

            const isDark = document.documentElement.classList.contains('dark');
            if (mapRef.current) {
                const map = L.map(mapRef.current).setView([center.lat, center.lng], zoom);
                mapInstanceRef.current = map;

                const tileLayer = isDark
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

                const attribution = isDark
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

                L.tileLayer(tileLayer, {
                    attribution,
                    subdomains: 'abcd',
                    maxZoom: 19,
                }).addTo(map);

                // ---- Center marker ----
                const centerIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="bg-blue-600 w-5 h-5 rounded-full border-2 border-white shadow-md ${
                        onMapClick ? 'cursor-move' : ''
                    }"></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                });

                const centerMarker = L.marker([center.lat, center.lng], {
                    icon: centerIcon,
                    draggable: !!onMapClick,
                })
                    .addTo(map)
                    .bindPopup(center.name || 'Selected Location');

                currentMarkerRef.current = centerMarker;

                // Drag handler
                if (onMapClick) {
                    centerMarker.on('dragend', (e) => {
                        const position = e.target.getLatLng();
                        onMapClick({
                            lat: position.lat,
                            lng: position.lng,
                            name: 'Selected Location',
                        });
                    });
                }

                // Map click handler
                if (onMapClick) {
                    map.on('click', (e) => {
                        const { lat, lng } = e.latlng;
                        currentMarkerRef.current?.setLatLng([lat, lng]);
                        onMapClick({ lat, lng, name: 'Selected Location' });
                    });
                }

                // Other markers
                markers.forEach((marker) => {
                    const markerIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div class="bg-emerald-500 w-4 h-4 rounded-full border border-white shadow-md"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                    });

                    const leafletMarker = L.marker([marker.lat, marker.lng], {
                        icon: markerIcon,
                    })
                        .addTo(map)
                        .bindPopup(marker.name || 'Location');

                    if (onMarkerClick) {
                        leafletMarker.on('click', () => onMarkerClick(marker));
                    }
                });
            }
        };

        loadMap();

        return () => {
            mapInstanceRef.current?.remove();
            mapInstanceRef.current = null;
            currentMarkerRef.current = null;
        };
    }, []); // only run once (init + cleanup)

    // ---- UPDATE PHASE ----
    useEffect(() => {
        const map = mapInstanceRef.current;
        const marker = currentMarkerRef.current;
        if (map && map._loaded && marker) {
            marker.setLatLng([center.lat, center.lng]);
            map.setView([center.lat, center.lng]);
        }
    }, [center.lat, center.lng]);
}