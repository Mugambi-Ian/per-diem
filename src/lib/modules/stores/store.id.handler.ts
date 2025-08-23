import {storeSchema} from "@/lib/modules/stores/schema/store";
import {DateTime} from "luxon";
import {ApiResponse} from "@/lib/utils/response";
import {StoreService} from "@/lib/modules/stores/service/store.service";
import {NextRequest} from "next/server";
import {JWTPayload} from "jose";

interface Params {
    id: string;
}

export async function StoreIdGetHandler(req: NextRequest, params?: Params): Promise<ApiResponse> {
    const {id} = params!;
    const result = await StoreService.get(id);
    if (result) return result;
    return {success: false, error: {message: "Store not found"}, status: 404};
}

export async function StoreIdPutHandler(req: NextRequest, params?: Params, jwt?: JWTPayload): Promise<ApiResponse> {
    const userId = jwt?.sub;
    const body = await req.json();
    const parsed = storeSchema.safeParse(body);

    if (!parsed.success) return {success: false, error: parsed.error.flatten(), status: 400};

    const {timezone} = parsed.data;
    if (!DateTime.now().setZone(timezone).isValid) {
        return {success: false, error: {message: "Invalid timezone"}, status: 400};
    }

    const updated = await StoreService.update(params!.id, userId!, parsed.data);
    if ("error" in updated) return {success: false, error: {message: updated.error}, status: 400};

    return updated;
}

export async function StoreIdDeleteHandler(req: NextRequest, params?: Params, jwt?: JWTPayload): Promise<ApiResponse> {
    const userId = jwt?.sub;
    if (!userId) return {success: false, error: {message: "UNAUTHORIZED"}, status: 401};

    const deleted = await StoreService.remove(params!.id, userId);
    if ("error" in deleted) return {success: false, error: {message: deleted.error}, status: 404};

    return deleted;
}
