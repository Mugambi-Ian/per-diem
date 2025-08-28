import { DateTime } from "luxon";
import { ProductAvailability } from "@/lib/modules/product/schema/product";
import { logger } from "@/lib/utils/logger";
import { RRule } from "rrule";

export function isAvailableNow(
    availability: ProductAvailability[],
    now?: DateTime
): boolean {
    if (!availability || availability.length === 0) return false;

    const nowUtc = now?.toUTC() ?? DateTime.utc();

    return availability.some((a) => {
        try {
            // Validate timezone
            if (!DateTime.now().setZone(a.timezone).isValid) {
                logger.warn(`Invalid timezone: ${a.timezone}`);
                return false;
            }

            // ---- Special Dates Override ----
            if (a.specialDates) {
                const todayStr = nowUtc.setZone(a.timezone).toISODate();
                if (todayStr && a.specialDates[todayStr] !== undefined) {
                    return a.specialDates[todayStr];
                }
            }

            // ---- Day of Week Check ----
            const nowLocal = nowUtc.setZone(a.timezone);
            const luxonWeekday = nowLocal.weekday; // 1 = Mon ... 7 = Sun
            const ourWeekday = luxonWeekday === 7 ? 0 : luxonWeekday;
            if (Array.isArray(a.dayOfWeek) && a.dayOfWeek.length > 0) {
                if (!a.dayOfWeek.includes(ourWeekday)) return false;
            }

            // ---- Parse UTC times ----
            const startUtc = DateTime.fromISO(a.startTimeUtc).toUTC();
            let endUtc = DateTime.fromISO(a.endTimeUtc).toUTC();

            // Handle cross-midnight
            const isCrossMidnight = endUtc <= startUtc;
            if (isCrossMidnight) endUtc = endUtc.plus({ days: 1 });

            // ---- Recurrence Rule Check ----
            if (a.recurrenceRule) {
                try {
                    const rule = new RRule({
                        ...a.recurrenceRule,
                        dtstart: startUtc.toJSDate(),
                    });
                    const occurrences = rule.between(
                        startUtc.minus({ days: 1 }).toJSDate(),
                        endUtc.plus({ days: 1 }).toJSDate(),
                        true
                    );
                    if (occurrences.length === 0) return false;
                } catch (e) {
                    logger.warn(e, "Invalid recurrence rule");
                }
            }

            // ---- Final availability check ----
            return isCrossMidnight
                ? nowUtc >= startUtc || nowUtc < endUtc
                : nowUtc >= startUtc && nowUtc < endUtc;
        } catch (error) {
            logger.error(error, "Error checking availability");
            return false;
        }
    });
}

export function getNextAvailableTime(
    availability: ProductAvailability[],
    now?: DateTime
): DateTime | null {
    if (!availability || availability.length === 0) return null;

    const nowUtc = now?.toUTC() ?? DateTime.utc();
    let nextAvailable: DateTime | null = null;

    for (const a of availability) {
        try {
            const startUtc = DateTime.fromISO(a.startTimeUtc).toUTC();

            // Check next 7 days
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const candidate = startUtc.plus({ days: dayOffset });
                const candidateLocal = candidate.setZone(a.timezone);
                const luxonWeekday = candidateLocal.weekday;
                const ourWeekday = luxonWeekday === 7 ? 0 : luxonWeekday;
                if (a.specialDates) {
                    const candidateDateStr = candidate.setZone(a.timezone).toISODate();
                    if (candidateDateStr && a.specialDates[candidateDateStr] === false) {
                        continue; // skip this day
                    }
                }
                if (a.dayOfWeek.includes(ourWeekday) && candidate > nowUtc) {
                    if (!nextAvailable || candidate < nextAvailable) {
                        nextAvailable = candidate;
                    }
                }
            }
        } catch (error) {
            logger.error(error, "Error calculating next available time:");
        }
    }

    return nextAvailable;
}

export function getAvailabilityStatus(
    availability: ProductAvailability[],
    now: DateTime
): string {
    if (!availability || availability.length === 0) return "Not available";

    if (isAvailableNow(availability, now)) return "Available now";

    const nextTime = getNextAvailableTime(availability, now);
    if (nextTime) {
        const diff = nextTime.diff(now, ["days", "hours", "minutes"]);
        const days = diff.days;
        const hours = diff.hours;
        const minutes = diff.minutes;

        if (days >= 1) {
            return `Available in ${Math.round(days)} day${Math.round(days) > 1 ? "s" : ""}`;
        } else if (hours >= 1) {
            return `Available in ${Math.round(hours)} hour${Math.round(hours) > 1 ? "s" : ""}`;
        } else {
            return `Available in ${Math.round(minutes)} minute${Math.round(minutes) > 1 ? "s" : ""}`;
        }
    }

    return "Availability unknown";
}
