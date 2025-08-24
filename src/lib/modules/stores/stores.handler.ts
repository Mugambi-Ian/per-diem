import {storeQuery, storeSchema, validateStoreHours} from "@/lib/modules/stores/schema/store";
import {NextRequest} from "next/server";
import {StoreService} from "@/lib/modules/stores/service/store.service";
import {JWTPayload} from "jose";
import {DateTime} from "luxon";
import {ApiResponse} from "@/lib/utils/response";

type Response = ApiResponse<{
    id?:string;
    payload?:any[]
}>

export async function StoresGetHandler(req: NextRequest): Promise<Response> {
    const {searchParams} = new URL(req.url);
    const parsed = storeQuery.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
        return {
            success: false,
            error: {code: "INVALID_QUERY", message: JSON.stringify(parsed.error.flatten())},
            status: 400,
        };
    }

    // Extract user timezone from headers
    const userTimezone = req.headers.get("x-user-timezone") || 
                       req.headers.get("x-timezone") ||
                       req.headers.get("timezone");

    // Add user timezone to the query data if available
    const queryData = {
        ...parsed.data,
        userTimezone: userTimezone || undefined
    };

    return await StoreService.list(queryData);
}

export async function StoresPostHandler(req: NextRequest, _params: any, jwt?: JWTPayload): Promise<Response> {
    const body = await req.json();
    const parsed = storeSchema.safeParse(body);

    if (!parsed.success) {
        return {
            success: false,
            error: {code: "INVALID_BODY", message: JSON.stringify(parsed.error.flatten())},
            status: 400,
        };
    }

    if (!DateTime.local().setZone(parsed.data.timezone).isValid) {
        return {
            success: false,
            error: {code: "INVALID_TIMEZONE", message: "Invalid timezone"},
            status: 400,
        };
    }
    const invalidHours = validateStoreHours(parsed.data.operatingHours, parsed.data.timezone);
    if (invalidHours.length) {
        return {
            success: false,
            error: {code: "INVALID_BODY", message: invalidHours},
            status: 400,
        };
    }

    return StoreService.create(parsed.data, `${jwt!.sub}`)
}