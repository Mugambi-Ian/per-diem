import {normalizeProductAvailability} from "../schema/product";
import {getAvailabilityStatus, getNextAvailableTime, isAvailableNow} from "@/lib/modules/product/utils/availability";
import {DateTime} from "luxon";


export function product_enrich(product: any, now: DateTime = DateTime.now()) {
    product.availability = product.availability?.flatMap(normalizeProductAvailability) ?? [];
    const isCurrentlyAvailable = isAvailableNow(product.availability, now);

    return {
        ...product,
        isAvailableNow: isCurrentlyAvailable,
        nextAvailableTime: getNextAvailableTime(product.availability, now),
        availabilityStatus: getAvailabilityStatus(product.availability, now),
    };
}
