// __tests__/productAvailability.edgecases.test.ts
import { DateTime } from "luxon";
import { getAvailabilityStatus, getNextAvailableTime, isAvailableNow } from "@/lib/modules/product/utils/availability";

describe("isAvailableNow - edge cases", () => {
    it("cross-midnight availability blocked by specialDates", () => {
        const start = DateTime.fromISO("2025-08-23T22:00:00Z");
        const end = DateTime.fromISO("2025-08-24T02:00:00Z");
        const now = DateTime.fromISO("2025-08-24T01:00:00Z");

        const availability = [
            {
                id: "7",
                productId: "p1",
                dayOfWeek: [0,1,2,3,4,5,6],
                startTime: "22:00",
                endTime: "02:00",
                timezone: "UTC",
                startTimeUtc: start.toISO()!,
                endTimeUtc: end.toISO()!,
                specialDates: { "2025-08-24": false },
            }
        ];
        expect(isAvailableNow(availability, now)).toBe(false);
    });

    it("multiple availability windows in one day", () => {
        const now = DateTime.fromISO("2025-08-24T15:30:00Z");
        const availability = [
            {
                id: "w1",
                productId: "p1",
                dayOfWeek: [0,1,2,3,4,5,6],
                startTime: "08:00",
                endTime: "10:00",
                timezone: "UTC",
                startTimeUtc: DateTime.fromISO("2025-08-24T08:00:00Z").toISO()!,
                endTimeUtc: DateTime.fromISO("2025-08-24T10:00:00Z").toISO()!,
            },
            {
                id: "w2",
                productId: "p1",
                dayOfWeek: [0,1,2,3,4,5,6],
                startTime: "15:00",
                endTime: "16:00",
                timezone: "UTC",
                startTimeUtc: DateTime.fromISO("2025-08-24T15:00:00Z").toISO()!,
                endTimeUtc: DateTime.fromISO("2025-08-24T16:00:00Z").toISO()!,
            },
        ];

        expect(isAvailableNow(availability, now)).toBe(true);
    });

    it("invalid availability data returns false", () => {
        expect(isAvailableNow([{
            id: "x",
            productId: "p1",
            dayOfWeek: [],
            startTime: "",
            endTime: "",
            timezone: "UTC",
            startTimeUtc: "",
            endTimeUtc: "",
        }])).toBe(false);

        expect(isAvailableNow([{
            id: "x2",
            productId: "p1",
            dayOfWeek: [0],
            startTime: "09:00",
            endTime: "10:00",
            timezone: "Invalid/Zone",
            startTimeUtc: "2025-08-24T09:00:00Z",
            endTimeUtc: "2025-08-24T10:00:00Z",
        }])).toBe(false);
    });

    it("non-UTC timezone handling", () => {
        const now = DateTime.fromISO("2025-08-24T12:00:00Z"); // 08:00 EDT
        const start = DateTime.fromISO("2025-08-24T08:00:00-04:00"); // EDT
        const end = DateTime.fromISO("2025-08-24T10:00:00-04:00");

        const availability = [
            {
                id: "tz1",
                productId: "p1",
                dayOfWeek: [0,1,2,3,4,5,6],
                startTime: "08:00",
                endTime: "10:00",
                timezone: "America/New_York",
                startTimeUtc: start.toUTC().toISO()!,
                endTimeUtc: end.toUTC().toISO()!,
            }
        ];
        expect(isAvailableNow(availability, now)).toBe(true);
    });

    it("edge of startTime and endTime", () => {
        const start = DateTime.fromISO("2025-08-24T09:00:00Z").setZone("UTC");
        const end = DateTime.fromISO("2025-08-24T11:00:00Z").setZone("UTC");

        const availability = [
            {
                id: "edge1",
                productId: "p1",
                dayOfWeek: [0,1,2,3,4,5,6],
                startTime: "09:00",
                endTime: "11:00",
                timezone: "UTC",
                startTimeUtc: start.toISO()!,
                endTimeUtc: end.toISO()!,
            }
        ];
        expect(isAvailableNow(availability, end)).toBe(false);
        expect(isAvailableNow(availability, start)).toBe(true);
    });
});

describe("getNextAvailableTime - edge cases", () => {
    it("skips specialDates when finding next available time", () => {
        const now = DateTime.fromISO("2025-08-24T12:00:00Z");
        const start = DateTime.fromISO("2025-08-24T10:00:00Z");
        const end = DateTime.fromISO("2025-08-24T12:00:00Z");

        const availability = [
            {
                id: "sp1",
                productId: "p1",
                dayOfWeek: [0,1,2,3,4,5,6],
                startTime: "10:00",
                endTime: "12:00",
                timezone: "UTC",
                startTimeUtc: start.toISO()!,
                endTimeUtc: end.toISO()!,
                specialDates: { "2025-08-25": false },
            }
        ];
        const next = getNextAvailableTime(availability, now);
        expect(next?.day).toBe(now.plus({ days: 2 }).day);
    });

    it("multiple windows per day returns closest upcoming", () => {
        const now = DateTime.fromISO("2025-08-24T09:00:00Z");
        const availability = [
            {
                id: "w1",
                productId: "p1",
                dayOfWeek: [0,1,2,3,4,5,6],
                startTime: "08:00",
                endTime: "09:30",
                timezone: "UTC",
                startTimeUtc: DateTime.fromISO("2025-08-24T08:00:00Z").toISO()!,
                endTimeUtc: DateTime.fromISO("2025-08-24T09:30:00Z").toISO()!,
            },
            {
                id: "w2",
                productId: "p1",
                dayOfWeek: [0,1,2,3,4,5,6],
                startTime: "10:00",
                endTime: "11:00",
                timezone: "UTC",
                startTimeUtc: DateTime.fromISO("2025-08-24T10:00:00Z").toISO()!,
                endTimeUtc: DateTime.fromISO("2025-08-24T11:00:00Z").toISO()!,
            }
        ];
        const next = getNextAvailableTime(availability, now);
        expect(next?.hour).toBe(10);
    });

    it("wrap-around week when no availability remaining today", () => {
        const now = DateTime.fromISO("2025-08-24T23:00:00Z"); // Sunday
        const start = DateTime.fromISO("2025-08-25T10:00:00Z");
        const end = DateTime.fromISO("2025-08-25T12:00:00Z");

        const availability = [
            {
                id: "w3",
                productId: "p1",
                dayOfWeek: [1], // Monday
                startTime: "10:00",
                endTime: "12:00",
                timezone: "UTC",
                startTimeUtc: start.toISO()!,
                endTimeUtc: end.toISO()!,
            }
        ];
        const next = getNextAvailableTime(availability, now);
        expect(next?.weekday).toBe(1);
    });
});

describe("getAvailabilityStatus - edge cases", () => {
    it("cross-midnight availability reflected in status", () => {
        const now = DateTime.fromISO("2025-08-24T01:00:00Z");
        const start = DateTime.fromISO("2025-08-23T22:00:00Z");
        const end = DateTime.fromISO("2025-08-24T02:00:00Z");

        const availability = [
            {
                id: "cm1",
                productId: "p1",
                dayOfWeek: [0,1,2,3,4,5,6],
                startTime: "22:00",
                endTime: "02:00",
                timezone: "UTC",
                startTimeUtc: start.toISO()!,
                endTimeUtc: end.toISO()!,
            }
        ];
        expect(getAvailabilityStatus(availability, now)).toBe("Available now");
    });

});
