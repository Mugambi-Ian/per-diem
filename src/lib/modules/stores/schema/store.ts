import { z } from "zod";
import {DateTime, IANAZone} from "luxon";

export const operatingHourSchema = z.object({
    dayOfWeek: z.number().min(0).max(6), // 0 = Sunday
    openTime: z.string().regex(/^\d{2}:\d{2}$/), // "09:00"
    closeTime: z.string().regex(/^\d{2}:\d{2}$/), // "21:00"
    isOpen: z.boolean().default(true),
    closesNextDay: z.boolean().default(false),
    dstAware: z.boolean().default(true),
});

export const storeSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    address: z.string().min(2),
    timezone: z.string(), // validate IANA timezone later w/ luxon
    lat: z.number(),
    lng: z.number(),
    operatingHours: z.array(operatingHourSchema).nonempty(),
});
export const storeUpdateSchema =storeSchema.partial();
export const storeQuery = z.object({
    q: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sort: z.enum(["name", "createdAt", "distance"]).optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    radius: z.coerce.number().min(0).optional(), // in km
});

export interface OperatingHour {
    dayOfWeek: number; // 0 = Sunday
    isOpen: boolean;
    openTime: string; // "HH:mm"
    closeTime: string; // "HH:mm"
    closesNextDay?: boolean;
    dstAware?: boolean; // Handle DST transitions
}

export interface Store {
    timezone: string;
    operatingHours: OperatingHour[];
}

export interface StoreHoursResult {
    isOpen: boolean;
    nextOpen: Date | null;
    closedOn: { start: Date; end: Date }[];
    dstWarnings?: string[]; // Warnings about DST edge cases
}


export function validateStoreHours(hours: ReturnType<typeof storeSchema.parse>['operatingHours'], timezone: string): string[] {
    const errors: string[] = [];

    for (const hour of hours) {
        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(hour.openTime)) {
            errors.push(`Invalid open time format: ${hour.openTime}`);
        }
        if (!timeRegex.test(hour.closeTime)) {
            errors.push(`Invalid close time format: ${hour.closeTime}`);
        }

        // Validate day of week
        if (hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
            errors.push(`Invalid day of week: ${hour.dayOfWeek}`);
        }

        // Check for logical inconsistencies
        const [openHour, openMin] = hour.openTime.split(':').map(Number);
        const [closeHour, closeMin] = hour.closeTime.split(':').map(Number);
        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        if (!hour.closesNextDay && closeMinutes <= openMinutes) {
            errors.push(`Close time (${hour.closeTime}) should be after open time (${hour.openTime}) or use closesNextDay flag`);
        }
    }

    // Validate timezone
    if (!IANAZone.isValidZone(timezone)) {
        errors.push(`Invalid timezone: ${timezone}`);
    }

    return errors;
}
