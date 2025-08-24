import { NextRequest } from "next/server";
import { JWTPayload } from "jose";
import { ApiResponse } from "@/lib/utils/response";
import { OrdersService } from "@/lib/modules/orders/service/orders.service";
import { orderUpdateSchema } from "@/lib/modules/orders/schema/order";

export async function OrderIdGetHandler(
    req: NextRequest,
    params?: { id: string },
    jwt?: JWTPayload
): Promise<ApiResponse<{ order?: any }>> {
    if (!jwt?.sub) {
        return {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
            status: 401,
        };
    }

    if (!params?.id) {
        return {
            success: false,
            error: { code: "MISSING_ID", message: "Order ID is required" },
            status: 400,
        };
    }

    return await OrdersService.get(params.id, jwt.sub);
}

export async function OrderIdPutHandler(
    req: NextRequest,
    params?: { id: string },
    jwt?: JWTPayload
): Promise<ApiResponse<{ order?: any }>> {
    if (!jwt?.sub) {
        return {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
            status: 401,
        };
    }

    if (!params?.id) {
        return {
            success: false,
            error: { code: "MISSING_ID", message: "Order ID is required" },
            status: 400,
        };
    }

    const body = await req.json();
    const parsed = orderUpdateSchema.safeParse(body);

    if (!parsed.success) {
        return {
            success: false,
            error: { code: "INVALID_BODY", message: JSON.stringify(parsed.error.flatten()) },
            status: 400,
        };
    }

    return await OrdersService.update(params.id, parsed.data, jwt.sub);
}

export async function OrderIdDeleteHandler(
    req: NextRequest,
    params?: { id: string },
    jwt?: JWTPayload
): Promise<ApiResponse<{ success: boolean }>> {
    if (!jwt?.sub) {
        return {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
            status: 401,
        };
    }

    if (!params?.id) {
        return {
            success: false,
            error: { code: "MISSING_ID", message: "Order ID is required" },
            status: 400,
        };
    }

    return await OrdersService.delete(params.id, jwt.sub);
}
