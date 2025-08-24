import {DateTime} from "luxon";

export function date_normalize_DOW(val?: number) {
    if (!val) return undefined;
        if (val >= 0 && val <= 6) return val;
        // convert 1..7 (Luxon Mon=1..Sun=7) => 0..6 where 0 = Sun
        if (val >= 1 && val <= 7) return val % 7;
        return val;

}

export function date_to_zero_sun(d: number) {
    // luxon weekday 1..7 -> 0..6 with Sun=0
    return d % 7;
}

export function date_parse_HHMMT(dt: DateTime, hhmm: string, tz: string) {
    const [hh, mm] = hhmm.split(":").map(Number);
    let res = DateTime.fromObject(
        { year: dt.year, month: dt.month, day: dt.day, hour: hh, minute: mm },
        { zone: tz }
    );
    if (!res.isValid) {
        // advance to next valid minute up to some limit
        let tmp = res;
        let tries = 0;
        while (!tmp.isValid && tries < 8) {
            tmp = tmp.plus({ minutes: 30 });
            tries++;
        }
        res = tmp;
    }
    return res;
}

export function formatDate(date: Date, format: string): string {
    if (!isValidDate(date)) {
        throw new Error('Invalid date provided');
    }
    
    const dt = DateTime.fromJSDate(date);
    return dt.toFormat(format);
}

export function parseDate(dateString: string): Date | null {
    const dt = DateTime.fromISO(dateString);
    if (!dt.isValid) {
        return null;
    }
    return dt.toJSDate();
}

export function isValidDate(date: Date | null | undefined): boolean {
    if (!date) return false;
    return !isNaN(date.getTime());
}