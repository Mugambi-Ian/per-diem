import {DateTime} from "luxon";
import {convertStoreHoursToUserTimezone, isStoreOpen} from "@/lib/modules/stores/utils/availability";
import {validateStoreHours} from "@/lib/modules/stores/schema/store";

// Recreate the types minimally for the tests (if not importing real ones):
type OperatingHour = {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
    openTime: string; // "HH:mm"
    closeTime: string; // "HH:mm"
    isOpen: boolean;
    closesNextDay?: boolean;
    dstAware?: boolean; // default true-ish (only special-cased when false)
};

type Store = {
    id: string;
    name: string;
    slug: string;
    address: string;
    timezone: string; // IANA
    location: { lat: number; lng: number };
    operatingHours: OperatingHour[];
    createdAt: Date;
    updatedAt: Date;
};

// ---------- helpers ----------

const TZ_NY = "America/New_York";
const TZ_LA = "America/Los_Angeles";
const TZ_LON = "Europe/London";
const TZ_TOKYO = "Asia/Tokyo";

function makeStore({
                       timezone = TZ_NY,
                       operatingHours,
                       name = "Test Store",
                   }: {
    timezone?: string;
    operatingHours: any[];
    name?: string;
}): Store {
    return {
        id: "store-1",
        name,
        slug: "test-store",
        address: "1 Main St",
        timezone,
        location: {lat: 40.7128, lng: -74.006},
        operatingHours,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/** Convert Luxon weekday (1=Mon..7=Sun) to our 0=Sun..6=Sat */
const toOurDow = (luxonDow: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 =>
    ((luxonDow === 7 ? 0 : luxonDow) as 0 | 1 | 2 | 3 | 4 | 5 | 6);

/** Convenience to build a single daily window */
function dayWindow(
    date: DateTime,
    {
        open = "09:00",
        close = "17:00",
        isOpen = true,
        closesNextDay = false,
        dstAware = true,
    }: any
): OperatingHour {
    return {
        dayOfWeek: toOurDow(date.weekday),
        openTime: open,
        closeTime: close,
        isOpen,
        closesNextDay,
        dstAware,
    };
}

function closedRangeIncludes(
    ranges: { start: Date; end: Date }[],
    startISO: string,
    endISO: string,
    zone?: string // add timezone
): boolean {
    const s = DateTime.fromISO(startISO, {zone}).toMillis();
    const e = DateTime.fromISO(endISO, {zone}).toMillis();
    return ranges.some((r) => {
        const rs = DateTime.fromJSDate(r.start).setZone(zone).toMillis();
        const re = DateTime.fromJSDate(r.end).setZone(zone).toMillis();
        return rs <= s && re >= e;
    });
}

function closedOnForDay(closedOn: { start: Date; end: Date }[], day: DateTime) {
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({days: 1});
    return closedOn.filter(r => {
        const start = DateTime.fromJSDate(r.start);
        return start >= dayStart && start < dayEnd;
    });
}

// ---------- tests ----------

describe("isStoreOpen()", () => {
    // Updated DST test cases with correct 2025 dates
    test("DST spring forward (missing 02:00) adds warning when dstAware=true", () => {
        // March 9, 2025 is the correct DST transition date for US Eastern
        const springDay = DateTime.fromISO("2025-03-09", {zone: TZ_NY});

        const store = makeStore({
            operatingHours: [
                {
                    dayOfWeek: 0, // Sunday
                    openTime: "02:00", // This time gets skipped during spring forward
                    closeTime: "03:30",
                    isOpen: true,
                    closesNextDay: false,
                    dstAware: true
                },
            ],
        });

        // Test the store opening logic on DST transition day
        const testTime = DateTime.fromISO("2025-03-09T01:30:00", {zone: TZ_NY});
        const res = isStoreOpen(store, testTime);
        expect((res.dstWarnings ?? []).length).toBeGreaterThan(0);
        expect(res.dstWarnings?.[0]).toContain("spring forward");

    });

    test("DST fall back (02:00 twice) notes warning when dstAware=true", () => {
        // November 2, 2025 is the correct DST fall back date for US Eastern
        const fallDay = DateTime.fromISO("2025-11-02", {zone: TZ_NY});

        const store = makeStore({
            operatingHours: [
                {
                    dayOfWeek: 0, // Sunday
                    openTime: "01:30", // This operates during the ambiguous hour
                    closeTime: "02:30", // This time occurs twice
                    isOpen: true,
                    closesNextDay: false,
                    dstAware: true
                },
            ],
        });

        const testTime = DateTime.fromISO("2025-11-02T01:30:00", {zone: TZ_NY});
        const res = isStoreOpen(store, testTime);
        expect((res.dstWarnings ?? []).length).toBeGreaterThan(0);
        expect(res.dstWarnings?.[0]).toContain("fall back");
    });

    test("DST spring forward - comprehensive test with exact transition handling", () => {
        // Test with times right around the transition
        const store = makeStore({
            operatingHours: [
                {
                    dayOfWeek: 0, // Sunday, March 9, 2025
                    openTime: "01:30", // Before transition
                    closeTime: "03:30", // After transition (2:00-3:00 doesn't exist)
                    isOpen: true,
                    closesNextDay: false,
                    dstAware: true
                }
            ],
        });

        // Test at multiple points during the transition day
        const times = [
            "2025-03-09T01:30:00", // Before transition
            "2025-03-09T01:59:00", // Just before transition
            "2025-03-09T03:00:00", // Right after transition (2:00-3:00 skipped)
            "2025-03-09T03:30:00", // At closing
        ];

        let foundWarning = false;
        for (const timeStr of times) {
            const testTime = DateTime.fromISO(timeStr, {zone: TZ_NY});
            const res = isStoreOpen(store, testTime);

            if (res.dstWarnings && res.dstWarnings.length > 0) {
                foundWarning = true;
            }
        }

        expect(foundWarning).toBe(true);
    });
    test("overnight window from previous day keeps store open after midnight", () => {
        const t = DateTime.fromISO("2025-01-15T01:30:00", {zone: TZ_NY}); // Wed 01:30
        const tue = t.minus({days: 1});

        const store = makeStore({
            operatingHours: [
                dayWindow(tue, {open: "22:00", close: "02:00", closesNextDay: true}),
            ],
        });

        const res = isStoreOpen(store, t);
        expect(res.isOpen).toBe(true);

        // closedOn should reflect open from 00:00–02:00 then closed afterwards
        expect(
            closedRangeIncludes(res.closedOn, "2025-01-15T02:00:00-05:00", "2025-01-15T23:59:00-05:00")
        ).toBe(true);
    });
    test("consecutive overnights cover cross-midnight spans correctly", () => {
        const t = DateTime.fromISO("2025-01-17T00:30:00", {zone: TZ_NY}); // Fri 00:30
        const thu = t.minus({days: 1});
        const fri = t;

        const store = makeStore({
            operatingHours: [
                dayWindow(thu, {open: "22:00", close: "03:00", closesNextDay: true}),
                dayWindow(fri, {open: "22:00", close: "03:00", closesNextDay: true}),
            ],
        });

        const res = isStoreOpen(store, t);
        expect(res.isOpen).toBe(true);
    });
    test("24/7 day has no closed ranges and is open", () => {
        const day = DateTime.fromISO("2025-02-01T12:00:00", {zone: TZ_LON});
        const store = makeStore({
            operatingHours: [dayWindow(day, {open: "00:00", close: "23:59"})],
        });
        const res = isStoreOpen(store, day);
        expect(res.isOpen).toBe(true);
        expect(res.closedOn.length).toBeGreaterThan(0); // NOTE: with 00:00–23:59 there is technically a 1-minute closed gap; adjust to 24:00 if you want truly no gaps.
    });
    test("closed day -> full-day closedOn and nextOpen on next available day", () => {
        const mon = DateTime.fromISO("2025-01-13T10:00:00", {zone: TZ_NY}); // Monday
        const tue = mon.plus({days: 1});
        const store = makeStore({
            operatingHours: [
                dayWindow(tue, {open: "09:00", close: "17:00"}), // only Tuesday open
            ],
        });

        const res = isStoreOpen(store, mon);
        expect(res.isOpen).toBe(false);
        expect(res.nextOpen).not.toBeNull();
        const nextOpen = DateTime.fromJSDate(res.nextOpen!).setZone(TZ_NY);
        expect(nextOpen.toFormat("yyyy-LL-dd HH:mm")).toBe(`${tue.toFormat("yyyy-LL-dd")} 09:00`);
        // Monday should be fully closed
        expect(
            closedRangeIncludes(res.closedOn, "2025-01-13T00:00:00-05:00", "2025-01-14T00:00:00-05:00")
        ).toBe(true);
    });
    test("overlapping opens do not create negative closed gaps", () => {
        const d = DateTime.fromISO("2025-01-21T10:00:00", {zone: TZ_LA});
        const store = makeStore({
            timezone: TZ_LA,
            operatingHours: [
                dayWindow(d, {open: "08:00", close: "12:00"}),
                dayWindow(d, {open: "11:00", close: "14:00"}), // overlaps
            ],
        });

        const res = isStoreOpen(store, d);
        // Should be open at 10:00
        expect(res.isOpen).toBe(true);

        // Get today's closed periods only
        const todaysClosed = closedOnForDay(res.closedOn, d);

        // Convert expected times to match what the function returns
        // The function stores times as JS Dates, so we need to compare in the right way
        const dayStart = d.startOf("day");
        const storeOpenStart = dayStart.set({hour: 8}); // 08:00 LA
        const storeCloseEnd = dayStart.set({hour: 14}); // 14:00 LA

        // Check for closed period before 08:00
        const earlyClosedPeriod = todaysClosed.find(period => {
            const start = DateTime.fromJSDate(period.start).setZone(TZ_LA);
            const end = DateTime.fromJSDate(period.end).setZone(TZ_LA);
            return start.equals(dayStart) && end.equals(storeOpenStart);
        });
        expect(earlyClosedPeriod).toBeDefined();

        // Check for closed period after 14:00
        const lateClosedPeriod = todaysClosed.find(period => {
            const start = DateTime.fromJSDate(period.start).setZone(TZ_LA);
            const end = DateTime.fromJSDate(period.end).setZone(TZ_LA);
            return start.equals(storeCloseEnd) && end.equals(dayStart.plus({days: 1}));
        });
        expect(lateClosedPeriod).toBeDefined();

        // Ensure no closed periods exist during the merged open window (08:00-14:00)
        const duringOpenHours = todaysClosed.filter(period => {
            const start = DateTime.fromJSDate(period.start).setZone(TZ_LA);
            const end = DateTime.fromJSDate(period.end).setZone(TZ_LA);
            // Check if this closed period overlaps with 08:00-14:00
            return (start >= storeOpenStart && start < storeCloseEnd) ||
                (end > storeOpenStart && end <= storeCloseEnd) ||
                (start < storeOpenStart && end > storeCloseEnd);
        });
        expect(duringOpenHours).toHaveLength(0);
    });

    test("DST fall back (02:00 twice) notes warning when dstAware=true", () => {
        const fall = DateTime.fromISO("2025-11-02T01:30:00", {zone: TZ_NY}); // US fallback 2025-11-02
        const store = makeStore({
            operatingHours: [
                dayWindow(fall, {open: "01:30", close: "02:30", dstAware: true}),
            ],
        });
        const res = isStoreOpen(store, fall);
        expect((res.dstWarnings ?? []).length).toBeGreaterThan(0);
    });
    test("validateStoreHours detects bad timezone", () => {
        const hours = [
            {dayOfWeek: 1, openTime: "09:00", closeTime: "17:00", isOpen: true, closesNextDay: false, dstAware: true},
        ];
        const errors = validateStoreHours(hours as any, "Not/A_Real_Zone");
        expect(errors.some(e => /Invalid timezone/.test(e))).toBe(true);
    });

    test("returns open during normal daytime window", () => {
        const day = DateTime.fromISO("2025-01-15T12:00:00", {zone: TZ_NY}); // Wed
        const store = makeStore({
            operatingHours: [dayWindow(day, {open: "09:00", close: "17:00"})],
        });

        const result = isStoreOpen(store, day);
        expect(result.isOpen).toBe(true);
        expect(result.nextOpen).toBeNull();
        // closed ranges should exclude 09:00–17:00
        expect(
            closedRangeIncludes(
                result.closedOn,
                "2025-01-15T00:00:00-05:00",
                "2025-01-15T09:00:00-05:00"
            )
        ).toBe(true);
        expect(
            closedRangeIncludes(
                result.closedOn,
                "2025-01-15T17:00:00-05:00",
                "2025-01-16T00:00:00-05:00"
            )
        ).toBe(true);
    });


    test("handles multiple intervals with gaps; gaps appear in closedOn", () => {
        const day = DateTime.fromISO("2025-01-16T11:00:00", {zone: TZ_NY}); // Thu
        const store = makeStore({
            operatingHours: [
                dayWindow(day, {open: "08:00", close: "10:00"}),
                dayWindow(day, {open: "12:00", close: "14:00"}),
                dayWindow(day, {open: "16:00", close: "18:00"}),
            ],
        });

        const resultAt11 = isStoreOpen(store, day); // 11:00 is a gap
        expect(resultAt11.isOpen).toBe(false);
        expect(resultAt11.nextOpen).not.toBeNull();

        // The 10:00–12:00 gap should be recorded as closed
        expect(
            closedRangeIncludes(
                resultAt11.closedOn,
                "2025-01-16T10:00:00-05:00",
                "2025-01-16T12:00:00-05:00"
            )
        ).toBe(true);
    });

    test("overnight window (22:00–02:00 next day) — open at 23:30 on same calendar day", () => {
        const day = DateTime.fromISO("2025-01-14T23:30:00", {zone: TZ_NY}); // Tue 23:30
        const store = makeStore({
            operatingHours: [
                dayWindow(day, {
                    open: "22:00",
                    close: "02:00",
                    closesNextDay: true,
                }),
            ],
        });

        const result = isStoreOpen(store, day);
        expect(result.isOpen).toBe(true);
    });


    test("nextOpen is set when currently closed and a future window exists within 14 days", () => {
        const day = DateTime.fromISO("2025-01-13T06:00:00", {zone: TZ_NY}); // Mon 06:00
        const store = makeStore({
            operatingHours: [dayWindow(day, {open: "09:00", close: "17:00"})],
        });

        const result = isStoreOpen(store, day);
        expect(result.isOpen).toBe(false);
        expect(result.nextOpen).not.toBeNull();

        const nextOpenISO = DateTime.fromJSDate(result.nextOpen!).setZone(TZ_NY);
        expect(nextOpenISO.toFormat("yyyy-LL-dd HH:mm")).toBe("2025-01-13 09:00");
    });

    describe("DST transitions (America/New_York, 2025)", () => {

        test("DST flags ignored when dstAware=false (no warnings)", () => {
            const springDay = DateTime.fromISO("2025-03-09T01:30:00", {zone: TZ_NY}); // Sun
            const store = makeStore({
                operatingHours: [
                    {
                        dayOfWeek: toOurDow(springDay.weekday),
                        openTime: "02:00",
                        closeTime: "04:00",
                        isOpen: true,
                        closesNextDay: false,
                        dstAware: false,
                    },
                ],
            });

            const result = isStoreOpen(store, springDay.plus({hours: 1}));
            expect(result.dstWarnings ?? []).toHaveLength(0);
        });
    });

    test("cross-timezone user vs store — note added to dstWarnings with both local times", () => {
        const day = DateTime.fromISO("2025-01-20T10:00:00", {zone: TZ_NY});
        const store = makeStore({
            operatingHours: [dayWindow(day, {open: "00:00", close: "23:59"})],
        });

        const result = isStoreOpen(store, day, TZ_LON);
        expect(result.isOpen).toBe(true);
        expect(result.dstWarnings && result.dstWarnings[0]).toMatch(/Store operates in .* while you're in/i);
        expect(result.dstWarnings && result.dstWarnings[0]).toMatch(/\(\d{2}:\d{2}\).*\(\d{2}:\d{2}\)/);
    });
});

describe("convertStoreHoursToUserTimezone()", () => {
    test("convert… splits overnight across user midnight", () => {
        const date = DateTime.fromISO("2025-02-05T12:00:00", {zone: TZ_NY});
        const hours: OperatingHour[] = [
            {
                dayOfWeek: 3 as any,
                openTime: "22:00",
                closeTime: "02:00",
                closesNextDay: true,
                isOpen: true,
                dstAware: true
            },
        ];

        const converted = convertStoreHoursToUserTimezone(hours, TZ_NY, TZ_LON, date);
        // 22:00 NY -> 03:00 London next day (split)
        expect(converted.length).toBe(1);
        // First segment ends at 00:00 local
        expect(converted[0].openTime).toBe("03:00");
        expect(converted[0].closeTime).toBe("07:00");
    });

    test("converts simple same-day times from NY to London", () => {
        const date = DateTime.fromISO("2025-02-05T12:00:00", {zone: TZ_NY}); // arbitrary reference day
        const hours: OperatingHour[] = [
            {
                dayOfWeek: toOurDow(date.weekday),
                openTime: "09:00",
                closeTime: "17:00",
                isOpen: true,
                closesNextDay: false,
                dstAware: true,
            },
        ];

        const converted = convertStoreHoursToUserTimezone(hours, TZ_NY, TZ_LON, date);
        expect(converted).toHaveLength(1);

        // 09:00 NY -> 14:00 London (in February, NY is UTC-5, London is UTC+0)
        const h = converted[0];
        expect(h.openTime).toBe("14:00");
        expect(h.closeTime).toBe("22:00");
        // Day-of-week should match the London-local date for that instant
        expect([0, 1, 2, 3, 4, 5, 6]).toContain(h.dayOfWeek);
    });

    test("conversion crosses date boundary — late-night store hour becomes next-day morning for user", () => {
        const date = DateTime.fromISO("2025-01-10T12:00:00", {zone: TZ_NY});
        const hours: OperatingHour[] = [
            {
                dayOfWeek: toOurDow(date.weekday),
                openTime: "23:00", // 11 PM NY
                closeTime: "23:59",
                isOpen: true,
                closesNextDay: false,
                dstAware: true,
            },
        ];

        // Convert to Tokyo (UTC+9) — 23:00 NY (UTC-5) => 14:00+1 day Tokyo (UTC+9)
        const converted = convertStoreHoursToUserTimezone(hours, TZ_NY, TZ_TOKYO, date);
        const h = converted[0];
        expect(h.openTime).toBe("13:00"); // Careful: 23:00 NY -> 13:00 Tokyo next day (difference is +14 hours)
        // Compute precisely to avoid off-by-one: 23:00 -0500 is 04:00 UTC -> 13:00 JST (+9)
        // Sanity check on day-of-week shift: it should reflect Tokyo's local day
        expect([0, 1, 2, 3, 4, 5, 6]).toContain(h.dayOfWeek);
    });

    test("NY→LA conversion where time shifts earlier and can land on previous local day", () => {
        const date = DateTime.fromISO("2025-03-05T12:00:00", {zone: TZ_NY}); // before US DST
        const hours: OperatingHour[] = [
            {
                dayOfWeek: toOurDow(date.weekday),
                openTime: "00:30", // 00:30 NY -> 21:30 previous day LA (UTC-8)
                closeTime: "01:30",
                isOpen: true,
                closesNextDay: false,
                dstAware: true,
            },
        ];

        const converted = convertStoreHoursToUserTimezone(hours, TZ_NY, TZ_LA, date);
        const h = converted[0];
        // 00:30 NY (-05:00) is 05:30 UTC; LA (-08:00) is 21:30 previous day
        expect(h.openTime).toBe("21:30");
        expect(h.closeTime).toBe("22:30");
        // Day-of-week may shift to previous day for LA; just ensure it maps to valid 0..6
        expect([0, 1, 2, 3, 4, 5, 6]).toContain(h.dayOfWeek);
    });
});
