import {NextRequest} from "next/server";
import {server_serialize_cookie} from "@/lib/modules/auth/utils/cookies";
import {ApiResponse} from "@/lib/utils/response";
import {AuthService} from "@/lib/modules/auth/service/auth.service";

export async function PostAuthLogout(req: NextRequest): Promise<ApiResponse> {
    const {parse} = await import("cookie");
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);

    const refreshId = cookies["refresh_token_id"];

    if (refreshId) await AuthService.logout(refreshId);


    // clear cookies
    const clear = (name: string, path = "/") =>
        server_serialize_cookie(name, "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path,
            maxAge: 0,
            domain: process.env.COOKIE_DOMAIN,
        });

    const clearCookies = [
        clear("access_token", "/"),
        clear("refresh_token", "/api/v1/auth"),
        clear("refresh_token_id", "/api/v1/auth"),
    ].join(", ");

    return {
        success: true,
        status: 200,
        headers: {"Set-Cookie": clearCookies, "Content-Type": "application/json"},
        data: {ok: true},
    };
}
