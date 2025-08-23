import {DateTime} from "luxon";
import {server_is_store_open} from "@/lib/modules/stores/utils/availability";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function server_store_enrich(store: any, lat?: number, lng?: number) {
    const now = DateTime.utc().setZone(store.timezone);
    const { isOpen, nextOpen ,closedOn} = server_is_store_open(store);

    let distanceKm: number | null = null;
    if (lat != null && lng != null) {
        distanceKm = haversineDistance(lat, lng, store.lat, store.lng);
    }

    return {
        ...store,
        closedOn,
        currentLocalTime: now.toISO(),
        isCurrentlyOpen: isOpen,
        nextOpenTime: nextOpen,
        distanceKm,
    };
}
