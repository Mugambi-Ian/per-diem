import { DateTime } from "luxon";
import {storeSchema} from "@/lib/modules/stores/schema/store";

interface OperatingHour {
    dayOfWeek: number; // 0 = Sunday
    isOpen: boolean;
    openTime: string; // "HH:mm"
    closeTime: string; // "HH:mm"
    closesNextDay?: boolean;
    dstAware?: boolean; // Handle DST transitions
}

interface Store {
    timezone: string;
    operatingHours: OperatingHour[];
}

interface StoreHoursResult {
    isOpen: boolean;
    nextOpen: Date | null;
    closedOn: { start: Date; end: Date }[];
    dstWarnings?: string[]; // Warnings about DST edge cases
}

export function server_is_store_open(
    store: Store,
    date?: DateTime,
    userTimezone?: string // For cross-timezone scenarios
): StoreHoursResult {
    // Use store timezone as reference point, but accept user timezone for context
    const storeNow = date?.setZone(store.timezone) ?? DateTime.now().setZone(store.timezone);
    const dstWarnings: string[] = [];

    const parseTime = (time: string, day: DateTime, zone: string): DateTime => {
        const [hour, minute] = time.split(":").map(Number);
        return DateTime.fromObject(
            {
                year: day.year,
                month: day.month,
                day: day.day,
                hour,
                minute,
                second: 0,
                millisecond: 0
            },
            { zone }
        );
    };

    const handleDSTTransition = (
        targetTime: DateTime,
        operatingHour: OperatingHour
    ): { time: DateTime; warning?: string } => {
        // Check if we're in a DST transition period
        const dayStart = targetTime.startOf('day');
        const dayEnd = targetTime.endOf('day');

        // Find DST transitions on this day
        const transitions = [];
        for (let hour = 0; hour < 24; hour++) {
            const testTime = dayStart.set({ hour });
            if (!testTime.isValid) {
                // This hour doesn't exist (spring forward)
                transitions.push({ type: 'spring', hour });
            } else {
                const nextHour = testTime.plus({ hours: 1 });
                if (nextHour.hour === testTime.hour + 2) {
                    // Hour was skipped (spring forward detected)
                    transitions.push({ type: 'spring', hour: hour + 1 });
                } else if (nextHour.hour === testTime.hour) {
                    // Hour repeated (fall back detected)
                    transitions.push({ type: 'fall', hour });
                }
            }
        }

        if (transitions.length === 0) {
            return { time: targetTime };
        }

        const transition = transitions[0];
        let warning: string | undefined;

        if (transition.type === 'spring') {
            // Spring forward: 2 AM becomes 3 AM
            if (targetTime.hour === 2 && operatingHour.dstAware !== false) {
                const adjustedTime = targetTime.plus({ hours: 1 });
                warning = `DST spring forward: ${targetTime.hour}:${targetTime.minute.toString().padStart(2, '0')} adjusted to ${adjustedTime.hour}:${adjustedTime.minute.toString().padStart(2, '0')}`;
                return { time: adjustedTime, warning };
            }
        } else if (transition.type === 'fall') {
            // Fall back: 2 AM happens twice
            if (targetTime.hour === 2 && operatingHour.dstAware !== false) {
                // For store hours, we typically want the first occurrence
                warning = `DST fall back: ${targetTime.hour}:${targetTime.minute.toString().padStart(2, '0')} occurs twice, using first occurrence`;
            }
        }

        return { time: targetTime, warning };
    };

    const isInRange = (now: DateTime, open: DateTime, close: DateTime): boolean => {
        // Handle overnight hours and DST edge cases
        if (close <= open) {
            // Overnight hours: open 22:00, close 06:00 next day
            return now >= open || now < close;
        } else {
            // Normal hours: open 09:00, close 17:00 same day
            return now >= open && now < close;
        }
    };

    let isOpen = false;
    let nextOpen: Date | null = null;
    const closedOn: { start: Date; end: Date }[] = [];

    // Look ahead 14 days to handle complex DST scenarios
    for (let i = 0; i < 14; i++) {
        const checkDay = storeNow.plus({ days: i });

        // Handle weekday calculation correctly for all timezones
        const weekday = checkDay.weekday === 7 ? 0 : checkDay.weekday; // Convert Luxon (1-7) to our format (0-6)

        const dayHours = store.operatingHours
            .filter(h => h.dayOfWeek === weekday && h.isOpen)
            .map(h => {
                const openResult = handleDSTTransition(
                    parseTime(h.openTime, checkDay, store.timezone),
                    h
                );
                let open = openResult.time;

                const closeResult = handleDSTTransition(
                    parseTime(h.closeTime, checkDay, store.timezone),
                    h
                );
                let close = closeResult.time;

                // Handle overnight hours
                if (h.closesNextDay || close <= open) {
                    close = close.plus({ days: 1 });
                }

                // Collect DST warnings
                if (openResult.warning) dstWarnings.push(openResult.warning);
                if (closeResult.warning) dstWarnings.push(closeResult.warning);

                return { open, close, original: h };
            })
            .sort((a, b) => a.open.toMillis() - b.open.toMillis());

        // Handle closed days
        if (dayHours.length === 0) {
            const start = checkDay.startOf("day");
            const end = start.plus({ days: 1 });
            closedOn.push({ start: start.toJSDate(), end: end.toJSDate() });
            continue;
        }

        // Build detailed closed periods within the day
        let currentTime = checkDay.startOf("day");

        for (const { open, close } of dayHours) {
            // Add closed period before this open period
            if (currentTime < open) {
                closedOn.push({
                    start: currentTime.toJSDate(),
                    end: open.toJSDate()
                });
            }

            // Check if currently open (only for today)
            if (i === 0 && isInRange(storeNow, open, close)) {
                isOpen = true;
            }

            // Track next opening time
            if (!isOpen && open > storeNow && (!nextOpen || open.toJSDate() < nextOpen)) {
                nextOpen = open.toJSDate();
            }

            // Move current time to after this period closes
            currentTime = close;
        }

        // Add closed period from last close time to end of day
        const dayEnd = checkDay.plus({ days: 1 }).startOf("day");
        if (currentTime < dayEnd) {
            closedOn.push({
                start: currentTime.toJSDate(),
                end: dayEnd.toJSDate()
            });
        }
    }

    // Handle cross-timezone scenarios
    if (userTimezone && userTimezone !== store.timezone) {
        const userTime = storeNow.setZone(userTimezone);
        dstWarnings.push(
            `Note: Store operates in ${store.timezone} (${storeNow.toFormat('HH:mm')}) while you're in ${userTimezone} (${userTime.toFormat('HH:mm')})`
        );
    }

    const result: StoreHoursResult = {
        isOpen,
        nextOpen,
        closedOn
    };

    if (dstWarnings.length > 0) {
        result.dstWarnings = dstWarnings;
    }

    return result;
}

// Helper function for frontend to display times in user's timezone
export function convertStoreHoursToUserTimezone(
    storeHours: OperatingHour[],
    storeTimezone: string,
    userTimezone: string,
    date: DateTime = DateTime.now()
): OperatingHour[] {
    return storeHours.map(hour => {
        const storeDate = date.setZone(storeTimezone);
        const openTime = DateTime.fromObject(
            {
                year: storeDate.year,
                month: storeDate.month,
                day: storeDate.day,
                hour: parseInt(hour.openTime.split(':')[0]),
                minute: parseInt(hour.openTime.split(':')[1])
            },
            { zone: storeTimezone }
        ).setZone(userTimezone);

        const closeTime = DateTime.fromObject(
            {
                year: storeDate.year,
                month: storeDate.month,
                day: storeDate.day,
                hour: parseInt(hour.closeTime.split(':')[0]),
                minute: parseInt(hour.closeTime.split(':')[1])
            },
            { zone: storeTimezone }
        ).setZone(userTimezone);

        return {
            ...hour,
            openTime: openTime.toFormat('HH:mm'),
            closeTime: closeTime.toFormat('HH:mm'),
            dayOfWeek: openTime.weekday === 7 ? 0 : openTime.weekday
        };
    });
}


// Example usage and test cases
export function runDSTTests() {
    const testStore: Store = {
        timezone: 'America/New_York',
        operatingHours: [
            {
                dayOfWeek: 0, // Sunday
                isOpen: true,
                openTime: '01:30',
                closeTime: '03:30',
                dstAware: true
            },
            {
                dayOfWeek: 1, // Monday
                isOpen: true,
                openTime: '22:00',
                closeTime: '02:00',
                closesNextDay: true,
                dstAware: true
            }
        ]
    };

    // Test spring forward (March 2024)
    const springForward = DateTime.fromObject(
        { year: 2024, month: 3, day: 10, hour: 2, minute: 0 },
        { zone: 'America/New_York' }
    );

    // Test fall back (November 2024)
    const fallBack = DateTime.fromObject(
        { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
        { zone: 'America/New_York' }
    );

    console.log('Spring Forward Test:', server_is_store_open(testStore, springForward));
    console.log('Fall Back Test:', server_is_store_open(testStore, fallBack));
}