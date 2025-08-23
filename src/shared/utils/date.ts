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