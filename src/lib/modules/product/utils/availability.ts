import {DateTime} from "luxon";
import {ProductAvailability} from "@/lib/modules/product/utils/enrich";

/**
 * Utility function to normalize availability windows and detect conflicts
 */
export function normalizeAvailability(availability: Partial<ProductAvailability>): ProductAvailability[] {
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
            productId: availability.productId || '',
            dayOfWeek: availability.dayOfWeek,
            startTime: availability.startTime,
            endTime: availability.endTime,
            timezone,
            startTimeUtc: startLocal.toUTC().toISO() || '',
            endTimeUtc: endLocal.toUTC().toISO() || '',
        } as ProductAvailability];

    } catch (error) {
        // @ts-expect-error name
        throw {name: error?.name, message: "Error normalizing availability", cause: error}
    }
}

/**
 * Detect gaps and overlaps in availability windows
 */
export function detectGaps(availabilities: ProductAvailability[]) {
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
        dayAvailabilities.sort((a, b) => a.startTime.localeCompare(b.startTime));

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