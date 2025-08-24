import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/utils/response";
import { StoreService } from "@/lib/modules/stores/service/store.service";
import { storeAvailabilityQuerySchema } from "@/lib/modules/stores/schema/store";

export async function StoreAvailabilityGetHandler(
    req: NextRequest,
    params?: { id: string }
): Promise<ApiResponse<{ availability?: any }>> {
    if (!params?.id) {
        return {
            success: false,
            error: { code: "MISSING_ID", message: "Store ID is required" },
            status: 400,
        };
    }

    const { searchParams } = new URL(req.url);
    const parsed = storeAvailabilityQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
        return {
            success: false,
            error: { code: "INVALID_QUERY", message: JSON.stringify(parsed.error.flatten()) },
            status: 400,
        };
    }

    // Extract user timezone from headers
    const userTimezone = req.headers.get("x-user-timezone") || 
                       req.headers.get("x-timezone") ||
                       req.headers.get("timezone");

    return await StoreService.getAvailability(params.id, {
        ...parsed.data,
        userTimezone: userTimezone || undefined
    });
}
