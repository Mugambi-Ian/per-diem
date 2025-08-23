export const generic_default = <T>(val?: any) => {
    return (val || {}) as unknown as T;
};

export const generic_duplicate = <T>(val?: T, noDup?: boolean): T => {
    if (!noDup) return JSON.parse((object_stringify(val))) as T;
    // @ts-expect-error unknown
    return val;
};


export const object_stringify = (val?: unknown) => {
    return JSON.stringify(val || {},null,2);
};

export const isTrue = <T>(val?: T | string | number | T[] | symbol | null): boolean => {
    let isInvalid = val === undefined || val === null;
    isInvalid = isInvalid || (typeof val === 'number' && val === 0);
    isInvalid = isInvalid || (typeof val === 'string' && (val === '' || val === 'undefined'));
    isInvalid = isInvalid || (Array.isArray(val) && val.length === 0);
    return !isInvalid;
};

export function diff<T>(
    existing: T[],
    incoming: T[],
    comparator: (a: T, b: T) => boolean
) {
    const toDelete = existing.filter(
        (e) => !incoming.some((i) => comparator(i, e))
    );
    const toAdd = incoming.filter(
        (i) => !existing.some((e) => comparator(e, i))
    );
    return {toDelete, toAdd};
}