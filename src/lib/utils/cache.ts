import {LRUCache} from "lru-cache";

const availabilityCache = new LRUCache<string, any>({
    max: 500,
    ttl: 60 * 1000, // default 60s; product.cacheTTL can override per-response
});

export function server_get_cached_availability(key: string) {
    return availabilityCache.get(key);
}
export function server_set_cached_availability(key: string, value: any, ttlMs?: number) {
    availabilityCache.set(key, value, { ttl: ttlMs });
}
export function server_invalidate_availability_for_store(storeId: string) {
    // simple: loop keys (LRU supports .forEach)
    availabilityCache.forEach((val, key) => {
        if (key.startsWith(`${storeId}:`)) availabilityCache.delete(key);
    });
}
