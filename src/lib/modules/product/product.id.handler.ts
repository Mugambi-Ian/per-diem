import {NextRequest} from "next/server";
import {JWTPayload} from "jose";
import {ApiResponse} from "@/lib/utils/response";
import {productSchema} from "@/lib/modules/product/schema/product";
import {detectGaps, normalizeAvailability} from "@/lib/modules/product/utils/product";
import {ProductService} from "@/lib/modules/product/service/product.service";

export async function StoreProductIdPutHandler(
    req: NextRequest,
    params?: { id: string; productId: string },
    jwt?: JWTPayload
): Promise<ApiResponse> {
    const body = await req.json();
    const parse = productSchema.safeParse(body);
    if (!parse.success) {
        return {
            success: false,
            error: {code: "INVALID_BODY", message: JSON.stringify(parse.error.flatten())},
            status: 400,
        };
    }

    const parsed = parse.data;
    const availability = parsed.availability?.flatMap(normalizeAvailability) ?? [];
    const {gaps, overlaps} = detectGaps(availability);
    if (gaps.length > 0 || overlaps.length > 0) {
        return {
            status: 400,
            success: false,
            error: {error: "Invalid availability", details: {gaps, overlaps}},
        };
    }

    const product = {
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        availability,
        modifiers: parsed.modifiers ?? [],
    }

    return ProductService.update(product, params?.id, params?.productId, jwt?.sub);
}

export async function StoreProductIdDeleteHandler(
    _req: NextRequest,
    params?: { id: string; productId: string },
    jwt?: JWTPayload
): Promise<ApiResponse> {
    return ProductService.remove(params?.id, params?.productId, jwt?.sub);
}


export async function StoreProductIdGetHandler(
    _req: NextRequest,
    params?: { id: string; productId: string },
): Promise<ApiResponse> {

    const product = await ProductService.get(params?.id, params?.productId);
    if (product) return product;

    return {
        status: 404,
        success: false,
        error: {code: "NOT_FOUND", message: "Product not found"},
    };
}
