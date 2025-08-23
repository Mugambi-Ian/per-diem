import {NextRequest} from "next/server";
import {schema_login} from "@/lib/modules/auth/schema/login";
import {server_serialize_cookie} from "@/lib/modules/auth/utils/cookies";
import {ApiResponse} from "@/lib/utils/response";
import {AuthService} from "@/lib/modules/auth/service/auth.service";


export async function PostAuthLogin(req: NextRequest): Promise<ApiResponse> {
    const body = await req.json();
    const data = schema_login.parse(body);

    const res = await AuthService.login(data);
    const {accessToken, refreshTokenPlain, refreshTokenId, user} = res;

    // cookies
    const secure = process.env.NODE_ENV === "production";
    const domain = process.env.COOKIE_DOMAIN;

    const accessCookie = server_serialize_cookie("access_token", accessToken, {
        httpOnly: true,
        secure,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * Number(process.env.JWT_ACCESS_EXPIRES_MINUTES || 15),
        domain,
    });

    // store refresh token id + value in cookies (id can be used to fetch DB record)
    const refreshIdCookie = server_serialize_cookie("refresh_token_id", refreshTokenId, {
        httpOnly: true,
        secure,
        sameSite: "strict",
        path: "/api/v1/auth/refresh",
        maxAge: 60 * 60 * 24 * Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30),
        domain,
    });

    const refreshValueCookie = server_serialize_cookie("refresh_token", refreshTokenPlain, {
        httpOnly: true,
        secure,
        sameSite: "strict",
        path: "/api/v1/auth/refresh",
        maxAge: 60 * 60 * 24 * Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30),
        domain,
    });


    return {
        success: true,
        data: {user},
        status: 201,
        headers: {"Set-Cookie": [accessCookie, refreshIdCookie, refreshValueCookie].join(", ")}, // ✅ supported now
    };

}
