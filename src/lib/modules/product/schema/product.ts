import {z, ZodError} from "zod";
import {DateTime} from "luxon";
import {logger} from "@/lib/utils/logger";


export const productSchema = z.object({
    name: z.string().min(2),
    price: z.number().nonnegative(),
    description: z.string().optional(),
    availability: z.array(z.object({
        dayOfWeek: z.array(z.number().min(0).max(6)),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        timezone: z.string(),
        recurrenceRule: z.record(z.string(), z.any()).optional(),
        specialDates: z.record(
            z.string().regex(/^\d{4}(-\d{2}){1,2}$/), // YYYY-MM or YYYY-MM-DD
            z.boolean()
        ).optional()
    })).optional(),
    modifiers: z.array(z.object({
        id: z.string().optional(),
        name: z.string(),
        priceDelta: z.number().default(0),
    })).optional()
});
export const productUpdateSchema = productSchema.partial();


export type ProductInput = {
    name: string;
    price: number;
    description?: string;
    availability?: ProductAvailability[];
    modifiers?: ModifierInput[];
};

export type ModifierInput = {
    id?: string;
    name: string;
    priceDelta: number;
};

export type ProductUpdateInput = {
    name: string;
    description?: string;
    price: number;
    availability: ProductAvailability[];
    modifiers: ModifierInput[];
};

export interface ProductAvailability {
    id: string;
    productId: string;
    dayOfWeek: number[];      // 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday)
    startTime: string;        // e.g. "08:00"
    endTime: string;          // e.g. "11:00"
    startTimeUtc: string;     // ISO string in UTC
    endTimeUtc: string;       // ISO string in UTC
    timezone: string;         // e.g. "America/New_York"
    recurrenceRule?: Record<string, any>;
    specialDates?: Record<string, boolean>; // Better typing for special dates
}

export interface Product {
    id: string;
    storeId: string;
    name: string;
    price: number;
    description?: string;
    availability: ProductAvailability[];
    modifiers?: ProductModifier[];
    cacheTTL: number;
    lastModified: Date;
}

export interface ProductModifier {
    id: string;
    productId: string;
    name: string;
    priceDelta: number;
}


export function normalizeProductAvailability(availability: Partial<ProductAvailability>): ProductAvailability[] {
    if (!availability.dayOfWeek || !availability.startTime || !availability.endTime) {
        throw new Error("Missing required availability fields");
    }

    const timezone = availability.timezone || "UTC";

    try {
        // Validate timezone
        const testDate = DateTime.now().setZone(timezone);
        if (!testDate.isValid) {
            throw new Error(`Invalid timezone: ${timezone}`);
        }

        // Create a reference date for UTC conversion (using today)
        const referenceDate = DateTime.now().setZone(timezone).startOf("day");
        const [sh, sm] = availability.startTime.split(":").map(Number);
        const [eh, em] = availability.endTime.split(":").map(Number);

        const startLocal = referenceDate.set({hour: sh, minute: sm});
        let endLocal = referenceDate.set({hour: eh, minute: em});

        // Handle cross-midnight
        if (endLocal <= startLocal) {
            endLocal = endLocal.plus({days: 1});
        }

        return [{
            ...availability,
            id: availability.id || '',
            dayOfWeek: availability.dayOfWeek,
            startTime: availability.startTime,
            endTime: availability.endTime,
            timezone,
            startTimeUtc: startLocal.toUTC().toISO() || '',
            endTimeUtc: endLocal.toUTC().toISO() || '',
        } as ProductAvailability];

    } catch (error) {
        logger.error(error, "Error normalizing availability")
        // @ts-expect-error message
        throw new ZodError(`Invalid availability: ${String(error.message)}`);
    }
}

export function validateProductAvailability(availabilities: ProductAvailability[]) {
    const gaps: string[] = [];
    const overlaps: string[] = [];

    // Group by day of week for analysis
    const byDay: { [key: number]: ProductAvailability[] } = {};

    availabilities.forEach(a => {
        a.dayOfWeek.forEach(day => {
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(a);
        });
    });

    // Check for overlaps within each day
    Object.entries(byDay).forEach(([day, dayAvailabilities]) => {
        dayAvailabilities.sort((a, b) => a.startTimeUtc.localeCompare(b.startTimeUtc));

        for (let i = 0; i < dayAvailabilities.length - 1; i++) {
            const current = dayAvailabilities[i];
            const next = dayAvailabilities[i + 1];

            if (current.endTime > next.startTime) {
                overlaps.push(`Day ${day}: ${current.startTime}-${current.endTime} overlaps with ${next.startTime}-${next.endTime}`);
            }
        }
    });

    return {gaps, overlaps};
}