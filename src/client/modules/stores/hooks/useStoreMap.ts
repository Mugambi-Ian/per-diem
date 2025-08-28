'use client';

import { useMemo } from 'react';
import {Store} from "@/lib/modules/stores/schema/store";


export function useStoreMap(stores: Store[]) {
    const center = useMemo(() => {
        if (stores.length > 0) {
            return { lat: stores[0].lat, lng: stores[0].lng, name: 'Center' };
        }
        return { lat: 40.7128, lng: -74.0060, name: 'Default Center' };
    }, [stores]);

    const markers = useMemo(() => {
        return stores.map(store => ({
            lat: store.lat,
            lng: store.lng,
            name: store.name,
        }));
    }, [stores]);

    return { center, markers };
}