import {DateTime} from "luxon";
import {OperatingHour, Store, StoreHoursResult} from "@/lib/modules/stores/schema/store";

export function isStoreOpen(
    store: Store,
    date?: DateTime,
    userTimezone?: string // For cross-timezone scenarios
): StoreHoursResult {
    // Use store timezone as reference point, but accept user timezone for context
    const storeNow = (date ?? DateTime.now()).setZone(store.timezone, {keepLocalTime: false});
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
            {zone}
        );
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
        const checkDay = storeNow.plus({days: i});
        const dayStart = checkDay.startOf("day");
        const dayEnd = dayStart.plus({days: 1});

        // Handle weekday calculation correctly for all timezones
        const weekday = checkDay.weekday === 7 ? 0 : checkDay.weekday;

        const dayHours = store.operatingHours
            .filter(h => h.dayOfWeek === weekday && h.isOpen)
            .map(h => {
                const openResult = handleDSTTransition(
                    parseTime(h.openTime, checkDay, store.timezone),
                    h
                );
                const open = openResult.time;

                const closeResult = handleDSTTransition(
                    parseTime(h.closeTime, checkDay, store.timezone),
                    h
                );
                let close = closeResult.time;

                // Handle overnight hours
                if (h.closesNextDay || close <= open) {
                    close = close.plus({days: 1});
                }

                // Collect DST warnings
                if (openResult.warning) dstWarnings.push(openResult.warning);
                if (closeResult.warning) dstWarnings.push(closeResult.warning);

                return {open, close, original: h};
            })
            .sort((a, b) => a.open.toMillis() - b.open.toMillis());

        // Also pull in previous day's windows that spill past midnight into `checkDay`
        const prevDay = checkDay.minus({days: 1});
        const prevWeekday = prevDay.weekday % 7;

        const prevOvernights = store.operatingHours
            .filter(h => h.isOpen && (h.closesNextDay || (parseTime(h.closeTime, prevDay, store.timezone) <= parseTime(h.openTime, prevDay, store.timezone))))
            .filter(h => h.dayOfWeek === prevWeekday)
            .map(h => {
                const openResult = handleDSTTransition(parseTime(h.openTime, prevDay, store.timezone), h);
                const closeResult = handleDSTTransition(parseTime(h.closeTime, prevDay, store.timezone), h);

                const open = openResult.time;
                let close = closeResult.time;

                // Force next-day close for overnight
                if (h.closesNextDay || close <= open) close = close.plus({days: 1});

                // We only want the portion that falls on `checkDay`
                const startOfCheckDay = checkDay.startOf("day");
                const endOfCheckDay = startOfCheckDay.plus({days: 1});

                const clippedOpen = open < startOfCheckDay ? startOfCheckDay : open;
                const clippedClose = close > endOfCheckDay ? endOfCheckDay : close;

                // Only include if overlap exists
                if (clippedClose > clippedOpen) {
                    if (openResult.warning) dstWarnings.push(openResult.warning);
                    if (closeResult.warning) dstWarnings.push(closeResult.warning);
                    return {open: clippedOpen, close: clippedClose, original: h, _spill: true};
                }
                return null;
            })
            .filter(Boolean) as Array<{ open: DateTime; close: DateTime; original: OperatingHour; _spill: true }>;

        let intervals = [...dayHours, ...prevOvernights].map(h => ({open: h.open, close: h.close}));
        intervals = mergeIntervals(intervals);

        // Handle closed days
        if (intervals.length === 0) {
            const start = checkDay.startOf("day");
            const end = start.plus({days: 1});
            closedOn.push({start: start.toJSDate(), end: end.toJSDate()});
            continue;
        }

        // Build detailed closed periods within the day
        let currentTime = dayStart;

        for (const {open, close} of intervals) {
            // Add closed period before this interval opens
            if (currentTime < open) {
                closedOn.push({
                    start: currentTime.toJSDate(),
                    end: open.toJSDate(),
                });
            }

            // Check if store is open right now
            if (i === 0 && isInRange(storeNow, open, close)) {
                isOpen = true;
            }

            // Set next open time if we're currently closed and this is a future opening
            if (!isOpen && open > storeNow && (!nextOpen || open.toJSDate() < nextOpen)) {
                nextOpen = open.toJSDate();
            }

            // Move current time to end of this interval
            currentTime = close;
        }

        // Add closed period from last close time to end of day (only once)
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

export function convertStoreHoursToUserTimezone(
    storeHours: OperatingHour[],
    storeTimezone: string,
    userTimezone: string,
    date: DateTime = DateTime.now()
): OperatingHour[] {
    const storeDate = date.setZone(storeTimezone).startOf("day");

    const out: OperatingHour[] = [];

    for (const h of storeHours) {
        const [oh, om] = h.openTime.split(":").map(Number);
        const [ch, cm] = h.closeTime.split(":").map(Number);

        const open = storeDate.set({hour: oh, minute: om});
        let close = storeDate.set({hour: ch, minute: cm});

        // Overnight?
        if (h.closesNextDay || close <= open) close = close.plus({days: 1});

        // Convert both endpoints to user zone
        const uOpen = open.setZone(userTimezone);
        const uClose = close.setZone(userTimezone);

        // If the interval crosses midnight in user zone, split into at most two
        const uOpenDay = uOpen.startOf("day");
        const uCloseDay = uClose.startOf("day");

        const pushSegment = (a: DateTime, b: DateTime) => {
            out.push({
                ...h,
                dayOfWeek: a.weekday === 7 ? 0 : a.weekday,
                openTime: a.toFormat("HH:mm"),
                closeTime: b.toFormat("HH:mm"),
                // keep the original closesNextDay flag for UI hints (even if split)
                closesNextDay: b.startOf("day") > a.startOf("day"),
            });
        };

        if (uOpenDay.equals(uCloseDay)) {
            // Single segment
            pushSegment(uOpen, uClose);
        } else {
            // Split at midnight
            const midnight = uCloseDay;
            pushSegment(uOpen, midnight);
            pushSegment(midnight, uClose);
        }
    }

    // Sort for sanity
    return out.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.openTime.localeCompare(b.openTime);
    });
}

function mergeIntervals(intervals: { open: DateTime; close: DateTime }[]) {
    if (intervals.length === 0) return [];

    const sorted = intervals
        .map(i => ({
            open: i.open.startOf("minute"),  // normalize
            close: i.close.startOf("minute"),
        }))
        .sort((a, b) => a.open.toMillis() - b.open.toMillis());

    const merged: { open: DateTime; close: DateTime }[] = [];
    let current = {...sorted[0]};

    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        if (next.open <= current.close) {
            // merge
            current.close = next.close > current.close ? next.close : current.close;
        } else {
            merged.push(current);
            current = {...next};
        }
    }
    merged.push(current);
    return merged;
}

// Most reliable approach - check actual DST behavior:
const handleDSTTransition = (targetTime: DateTime, operatingHour: OperatingHour) => {
    if (operatingHour.dstAware === false) {
        return {time: targetTime};
    }

    // Check if this date has a DST transition by comparing day start and end offsets
    const dayStart = targetTime.startOf('day');
    const dayEnd = dayStart.endOf('day');

    const startOffset = dayStart.offset;
    const endOffset = dayEnd.offset;

    if (startOffset !== endOffset) {
        // DST transition detected on this day
        const isSpringForward = endOffset > startOffset;

        if (isSpringForward) {
            // Spring forward transition
            if (targetTime.hour === 2) {
                const adjustedTime = targetTime.set({hour: 3});
                const warning = `DST spring forward: ${targetTime.toFormat('HH:mm')} doesn't exist, adjusted to ${adjustedTime.toFormat('HH:mm')}`;
                return {time: adjustedTime, warning};
            }
            // Generate warning for any time that might be affected
            if (targetTime.hour >= 1 && targetTime.hour <= 3) {
                const warning = `DST spring forward: Operating near DST transition (2:00 AM skipped)`;
                return {time: targetTime, warning};
            }
        } else {
            // Fall back transition
            if (targetTime.hour >= 1 && targetTime.hour <= 2) {
                const warning = `DST fall back: ${targetTime.toFormat('HH:mm')} occurs twice during transition`;
                return {time: targetTime, warning};
            }
        }
    }

    return {time: targetTime};
};