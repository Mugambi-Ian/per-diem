import { NextRequest } from "next/server";
import { JWTPayload } from "jose";
import { ApiResponse } from "@/lib/utils/response";
import { UserService } from "@/lib/modules/user/service/user.service";
import { userTimezoneSchema } from "@/lib/modules/user/schema/user";

export async function UserTimezonePutHandler(
    req: NextRequest,
    _params: any,
    jwt?: JWTPayload
): Promise<ApiResponse<{ user?: any }>> {
    if (!jwt?.sub) {
        return {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
            status: 401,
        };
    }

    const body = await req.json();
    const parsed = userTimezoneSchema.safeParse(body);

    if (!parsed.success) {
        return {
            success: false,
            error: { code: "INVALID_BODY", message: JSON.stringify(parsed.error.flatten()) },
            status: 400,
        };
    }

    return await UserService.updateTimezone(jwt.sub, parsed.data.timezone);
}
