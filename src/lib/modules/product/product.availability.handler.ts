import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/utils/response";
import { ProductService } from "@/lib/modules/product/service/product.service";
import { productAvailabilityQuerySchema } from "@/lib/modules/product/schema/product";

export async function ProductAvailabilityGetHandler(
    req: NextRequest,
    params?: { id: string, productId: string }
): Promise<ApiResponse<{ availability?: any }>> {
    if (!params?.id || !params?.productId) {
        return {
            success: false,
            error: { code: "MISSING_PARAMS", message: "Store ID and Product ID are required" },
            status: 400,
        };
    }

    const { searchParams } = new URL(req.url);
    const parsed = productAvailabilityQuerySchema.safeParse(Object.fromEntries(searchParams));

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

    return await ProductService.getAvailability(params.productId, params.id, {
        ...parsed.data,
        userTimezone: userTimezone || undefined
    });
}
