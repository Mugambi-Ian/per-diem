import { NextRequest } from "next/server";
import { JWTPayload } from "jose";
import { ApiResponse } from "@/lib/utils/response";
import { OrdersService } from "@/lib/modules/orders/service/orders.service";
import { orderQuerySchema, orderCreateSchema } from "@/lib/modules/orders/schema/order";

export async function OrdersGetHandler(
    req: NextRequest,
    _params: any,
    jwt?: JWTPayload
): Promise<ApiResponse<{ orders?: any[], meta?: any }>> {
    if (!jwt?.sub) {
        return {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
            status: 401,
        };
    }

    const { searchParams } = new URL(req.url);
    const parsed = orderQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
        return {
            success: false,
            error: { code: "INVALID_QUERY", message: JSON.stringify(parsed.error.flatten()) },
            status: 400,
        };
    }

    return await OrdersService.list(parsed.data, jwt.sub);
}

export async function OrdersPostHandler(
    req: NextRequest,
    _params: any,
    jwt?: JWTPayload
): Promise<ApiResponse<{ order?: any }>> {
    if (!jwt?.sub) {
        return {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
            status: 401,
        };
    }

    const body = await req.json();
    const parsed = orderCreateSchema.safeParse(body);

    if (!parsed.success) {
        return {
            success: false,
            error: { code: "INVALID_BODY", message: JSON.stringify(parsed.error.flatten()) },
            status: 400,
        };
    }

    return await OrdersService.create(parsed.data, jwt.sub);
}
