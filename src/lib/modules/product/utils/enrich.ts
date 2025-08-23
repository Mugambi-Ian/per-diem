import {Product} from "../schema/product";
import {getAvailabilityStatus, getNextAvailableTime, isAvailableNow} from "@/lib/modules/product/utils/availability";


export function product_enrich(product: Product) {
    const isCurrentlyAvailable = isAvailableNow(product.availability);

    return {
        ...product,
        isAvailableNow: isCurrentlyAvailable,
        nextAvailableTime: getNextAvailableTime(product.availability),
        availabilityStatus: getAvailabilityStatus(product.availability),
    };
}
