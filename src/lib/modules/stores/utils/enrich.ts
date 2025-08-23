import {DateTime} from "luxon";
import {convertStoreHoursToUserTimezone, isStoreOpen} from "@/lib/modules/stores/utils/availability";
import {haversineDistance} from "@/lib/modules/stores/utils/distance";


export function store_enrich(store: any, lat?: number, lng?: number, userTimezone?: string) {
    const now = DateTime.utc().setZone(store.timezone);
    const {isOpen, nextOpen, closedOn} = isStoreOpen(store);

    let distanceKm: number | null = null;
    if (lat != null && lng != null) {
        distanceKm = haversineDistance(lat, lng, store.lat, store.lng);
    }
    if(userTimezone){
       store.localOperatingHours = convertStoreHoursToUserTimezone(store.operatingHours, store.timezone, userTimezone)
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
