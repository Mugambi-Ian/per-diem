import {DateTime} from "luxon";
import {ProductAvailability} from "@/lib/modules/product/schema/product";
import {logger} from "@/lib/utils/logger";
import {RRule} from "rrule";

export function isAvailableNow(availability: ProductAvailability[]): boolean {
    if (!availability || availability.length === 0) {
        return false;
    }

    const nowUtc = DateTime.utc();

    return availability.some(a => {
        try {
            // Validate timezone
            if (!DateTime.now().setZone(a.timezone).isValid) {
                logger.warn(`Invalid timezone: ${a.timezone}`);
                return false;
            }

            const nowLocal = nowUtc.setZone(a.timezone || "UTC");

            // ---- Special Dates Override (highest priority) ----
            if (a.specialDates) {
                const todayStr = nowLocal.toISODate(); // "2025-08-22"
                if (todayStr && a.specialDates[todayStr] !== undefined) {
                    return a.specialDates[todayStr];
                }
            }

            // ---- Day of Week Check ----
            // Convert Luxon weekday (1=Monday...7=Sunday) to our format (0=Sunday...6=Saturday)
            const luxonWeekday = nowLocal.weekday; // 1-7
            const ourWeekday = luxonWeekday === 7 ? 0 : luxonWeekday; // Convert Sunday from 7 to 0

            if (Array.isArray(a.dayOfWeek) && a.dayOfWeek.length > 0) {
                if (!a.dayOfWeek.includes(ourWeekday)) {
                    return false;
                }
            }

            // ---- Validate and parse time strings ----
            const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/;
            if (!timeRegex.test(a.startTime) || !timeRegex.test(a.endTime)) {
                console.warn(`Invalid time format: ${a.startTime} - ${a.endTime}`);
                return false;
            }

            const [sh, sm] = a.startTime.split(":").map(Number);
            const [eh, em] = a.endTime.split(":").map(Number);

            // ---- Build today's availability window ----
            const startLocal = nowLocal.startOf("day").set({hour: sh, minute: sm, second: 0, millisecond: 0});
            let endLocal = nowLocal.startOf("day").set({hour: eh, minute: em, second: 0, millisecond: 0});

            // Handle cross-midnight windows (e.g., 22:00 → 02:00 next day)
            if (endLocal <= startLocal) {
                endLocal = endLocal.plus({days: 1});
            }

            // ---- Recurrence Rule Check ----
            if (a.recurrenceRule) {
                try {
                    const rule = new RRule({
                        ...a.recurrenceRule,
                        dtstart: startLocal.toJSDate(),
                    });

                    // Check if current time falls within a valid recurrence
                    const occurrences = rule.between(
                        startLocal.minus({days: 1}).toJSDate(), // Check previous day for cross-midnight
                        endLocal.plus({days: 1}).toJSDate(),    // Check next day for cross-midnight
                        true
                    );

                    if (occurrences.length === 0) {
                        return false;
                    }
                } catch (e) {
                    logger.warn(e, "Invalid recurrence rule");
                    // Continue without recurrence rule if it's invalid
                }
            }

            // ---- Final availability check ----
            return nowLocal >= startLocal && nowLocal <= endLocal;

        } catch (error) {
            logger.error(error, "Error checking availability");
            return false;
        }
    });
}


export function getNextAvailableTime(availability: ProductAvailability[]): DateTime | null {
    if (!availability || availability.length === 0) return null;

    const nowUtc = DateTime.utc();
    let nextAvailable: DateTime | null = null;

    for (const a of availability) {
        try {
            const nowLocal = nowUtc.setZone(a.timezone || "UTC");
            const [sh, sm] = a.startTime.split(":").map(Number);

            // Check next 7 days for availability
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const checkDate = nowLocal.plus({days: dayOffset}).startOf("day");
                const luxonWeekday = checkDate.weekday;
                const ourWeekday = luxonWeekday === 7 ? 0 : luxonWeekday;

                if (a.dayOfWeek.includes(ourWeekday)) {
                    const availableTime = checkDate.set({hour: sh, minute: sm});

                    // Only consider future times
                    if (availableTime > nowLocal) {
                        if (!nextAvailable || availableTime < nextAvailable) {
                            nextAvailable = availableTime;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error calculating next available time:", error);
        }
    }

    return nextAvailable;
}


export function getAvailabilityStatus(availability: ProductAvailability[]): string {
    if (!availability || availability.length === 0) {
        return "Not available";
    }

    if (isAvailableNow(availability)) {
        return "Available now";
    }

    const nextTime = getNextAvailableTime(availability);
    if (nextTime) {
        const now = DateTime.utc();
        const diff = nextTime.diff(now);

        if (diff.as('hours') < 24) {
            return `Available in ${Math.round(diff.as('hours'))} hours`;
        } else {
            return `Available ${nextTime.toFormat('cccc')}`;
        }
    }

    return "Availability unknown";
}
