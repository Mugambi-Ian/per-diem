// __tests__/productAvailability.integration.test.ts
import {DateTime} from "luxon";
import {RRule} from "rrule";
import {getAvailabilityStatus, getNextAvailableTime, isAvailableNow} from "@/lib/modules/product/utils/availability";

describe("isAvailableNow", () => {

    it("returns false if no availability is provided", () => {
        expect(isAvailableNow([])).toBe(false);
        expect(isAvailableNow(undefined as any)).toBe(false);
    });

    it("returns true when current time is within normal availability", () => {
        const now = DateTime.utc(2025, 8, 24, 10, 0); // 10:00 UTC
        const availability = [
            {
                id: "1",
                productId: "p1",
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "09:00",
                endTime: "11:00",
                startTimeUtc: "2025-08-24T09:00:00Z",
                endTimeUtc: "2025-08-24T11:00:00Z",
                timezone: "UTC",
            },
        ];
        expect(isAvailableNow(availability, now)).toBe(true);
    });

    it("returns false when current time is outside availability", () => {
        const now = DateTime.utc(2025, 8, 24, 12, 0); // 12:00 UTC
        const availability = [
            {
                id: "1",
                productId: "p1",
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "09:00",
                endTime: "11:00",
                startTimeUtc: "2025-08-24T09:00:00Z",
                endTimeUtc: "2025-08-24T11:00:00Z",
                timezone: "UTC",
            },
        ];
        expect(isAvailableNow(availability, now)).toBe(false);
    });

    it("handles cross-midnight availability correctly", () => {
        const now = DateTime.utc(2025, 8, 24, 1, 0); // 01:00 UTC
        const availability = [
            {
                id: "2",
                productId: "p1",
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "22:00",
                endTime: "02:00",
                startTimeUtc: "2025-08-23T22:00:00Z",
                endTimeUtc: "2025-08-24T02:00:00Z",
                timezone: "UTC",
            },
        ];
        expect(isAvailableNow(availability, now)).toBe(true);
    });

    it("respects specialDates override", () => {
        const now = DateTime.utc(2025, 8, 24, 10, 0);
        const availability = [
            {
                id: "3",
                productId: "p1",
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "09:00",
                endTime: "11:00",
                startTimeUtc: "2025-08-24T09:00:00Z",
                endTimeUtc: "2025-08-24T11:00:00Z",
                timezone: "UTC",
                specialDates: {"2025-08-24": false},
            },
        ];
        expect(isAvailableNow(availability, now)).toBe(false);
    });

    it("works with real recurrence rules", () => {
        const now = DateTime.utc(2025, 8, 24, 10, 0);
        const rule = new RRule({
            freq: RRule.DAILY,
            dtstart: new Date(Date.UTC(2025, 7, 24, 9, 0)), // Aug 24 2025 09:00 UTC
        });

        const availability = [
            {
                id: "4",
                productId: "p1",
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "09:00",
                endTime: "11:00",
                startTimeUtc: "2025-08-24T09:00:00Z",
                endTimeUtc: "2025-08-24T11:00:00Z",
                timezone: "UTC",
                recurrenceRule: {
                    freq: "daily",
                },
            },
        ];

        expect(isAvailableNow(availability, now)).toBe(true);
    });

    it("returns false if dayOfWeek does not match", () => {
        const now = DateTime.utc(2025, 8, 24, 10, 0); // Sunday = 0
        const availability = [
            {
                id: "5",
                productId: "p1",
                dayOfWeek: [1, 2, 3, 4, 5, 6], // Monday-Saturday
                startTime: "09:00",
                endTime: "11:00",
                startTimeUtc: "2025-08-24T09:00:00Z",
                endTimeUtc: "2025-08-24T11:00:00Z",
                timezone: "UTC",
            },
        ];
        expect(isAvailableNow(availability, now)).toBe(false);
    });

});

describe("getNextAvailableTime", () => {

    it("returns null if no availability provided", () => {
        expect(getNextAvailableTime([])).toBeNull();
    });

    it("returns next available time today", () => {
        const now = DateTime.utc(2025, 8, 24, 8, 0);
        const availability = [
            {
                id: "1",
                productId: "p1",
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "10:00",
                endTime: "12:00",
                startTimeUtc: "2025-08-24T10:00:00Z",
                endTimeUtc: "2025-08-24T12:00:00Z",
                timezone: "UTC",
            },
        ];

        const next = getNextAvailableTime(availability);
        expect(next).not.toBeNull();
        expect(next?.toISO()).toContain("10:00:00.000Z");
    });

    it("returns next available time tomorrow if today passed", () => {
        const now = DateTime.utc(2025, 8, 24, 12, 0);
        const availability = [
            {
                id: "2",
                productId: "p1",
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "10:00",
                endTime: "12:00",
                startTimeUtc: "2025-08-24T10:00:00Z",
                endTimeUtc: "2025-08-24T12:00:00Z",
                timezone: "UTC",
            },
        ];

        const next = getNextAvailableTime(availability, now);
        expect(next).not.toBeNull();
        expect(next?.day).toBe(now.plus({days: 1}).day);
    });

    it("handles cross-midnight availability for next available time", () => {
        const now = DateTime.utc(2025, 8, 24, 1, 0);
        const availability = [
            {
                id: "3",
                productId: "p1",
                dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "22:00",
                endTime: "02:00",
                startTimeUtc: "2025-08-23T22:00:00Z",
                endTimeUtc: "2025-08-24T02:00:00Z",
                timezone: "UTC",
            },
        ];

        const next = getNextAvailableTime(availability);
        expect(next).not.toBeNull();
        // The next occurrence should still be today at 22:00
        expect(next?.hour).toBe(22);
    });

});

describe("getAvailabilityStatus", () => {

    it("returns 'Not available' if no availability provided", () => {
        expect(getAvailabilityStatus([], DateTime.now())).toBe("Not available");
    });

    it("returns 'Available now' if product is currently available", () => {
        const now = DateTime.utc();
        const availability = [
            {
                id: "4",
                productId: "p1",
                dayOfWeek: [now.weekday % 7],
                startTime: now.minus({hours: 1}).toFormat("HH:mm"),
                endTime: now.plus({hours: 1}).toFormat("HH:mm"),
                startTimeUtc: now.minus({hours: 1}).toUTC().toISO(),
                endTimeUtc: now.plus({hours: 1}).toUTC().toISO(),
                timezone: "UTC",
            },
        ];
        expect(getAvailabilityStatus(availability, now)).toBe("Available now");
    });

    it("returns 'Available in X hours' if available later today", () => {
        const now = DateTime.utc();
        const availability = [
            {
                id: "5",
                productId: "p1",
                dayOfWeek: [now.weekday % 7],
                startTime: now.plus({hours: 2}).toFormat("HH:mm"),
                endTime: now.plus({hours: 4}).toFormat("HH:mm"),
                startTimeUtc: now.plus({hours: 2}).toUTC().toISO(),
                endTimeUtc: now.plus({hours: 4}).toUTC().toISO(),
                timezone: "UTC",
            },
        ];

        const status = getAvailabilityStatus(availability, now);
        expect(status).toMatch(/Available in \d+ hours/);
    });

    it("returns 'Available <weekday>' if available in future days", () => {
        const now = DateTime.utc();
        const future = now.plus({days: 3});
        const availability = [
            {
                id: "6",
                productId: "p1",
                dayOfWeek: [future.weekday % 7],
                startTime: "10:00",
                endTime: "12:00",
                startTimeUtc: future.set({hour: 10}).toUTC().toISO(),
                endTimeUtc: future.set({hour: 12}).toUTC().toISO(),
                timezone: "UTC",
            },
        ];

        const status = getAvailabilityStatus(availability, now);
        expect(status).toMatch(/^Available \w+/); // e.g., "Available Wednesday"
    });

});
