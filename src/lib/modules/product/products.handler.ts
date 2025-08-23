import {NextRequest} from "next/server";
import {ApiResponse} from "@/lib/utils/response";
import {JWTPayload} from "jose";
import {ProductService} from "@/lib/modules/product/service/product.service";
import {StoreService} from "@/lib/modules/stores/service/store.service";
import {
    productSchema,
    validateProductAvailability,
    normalizeProductAvailability,
} from "@/lib/modules/product/schema/product";

export async function StoreProductPostHandler(
    req: NextRequest,
    params?: { id: string },
    jwt?: JWTPayload
): Promise<ApiResponse> {

    const body = await req.json();
    if (!(await StoreService.checkStoreOwnership(params?.id, jwt?.sub))) {
        return {status: 404, success: false, error: "Store not found"};
    }
    const parse = productSchema.safeParse(body);
    if (!parse.success) {
        return {
            success: false,
            error: {code: "INVALID_BODY", message: JSON.stringify(parse.error.flatten())},
            status: 400,
        };
    }
    const availabilities = parse.data.availability?.flatMap(normalizeProductAvailability) ?? [];
    const {gaps, overlaps} = validateProductAvailability(availabilities);
    if (gaps.length > 0 || overlaps.length > 0) {
        return {
            status: 400,
            success: false,
            error: {error: "Invalid availability", details: {gaps, overlaps}},
        };
    }
    const parsed = parse.data;
    const product = {
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        availability: availabilities,
        modifiers: parsed.modifiers ?? [],
    }

    return ProductService.create(product, params?.id);
}

export async function StoreProductGETHandler(
    req: NextRequest,
    params?: { id: string }
): Promise<ApiResponse> {
    const {searchParams} = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    return ProductService.list(page, limit, params?.id,);
}
