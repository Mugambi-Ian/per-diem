import {NextRequest} from "next/server";
import {server_verify_refresh_token_plain} from "@/lib/modules/auth/utils/token";
import {server_sign_access_token} from "@/lib/modules/auth/utils/jwt";
import {server_serialize_cookie} from "@/lib/modules/auth/utils/cookies";
import {ApiResponse} from "@/lib/utils/response";
import {RefreshTokenService} from "@/lib/modules/auth/service/refresh.service";

export async function PostAuthRefresh(req: NextRequest): Promise<ApiResponse<{ user: { id?: string } }>> {
    // server-side: read cookies
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
        cookieHeader
            .split(";")
            .map((s) => s.trim().split("="))
            .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
    );

    const refreshId = cookies["refresh_token_id"];
    const refreshPlain = cookies["refresh_token"];

    if (!refreshId || !refreshPlain) {
        return {
            success: false,
            status: 401,
            error: {code: "NO_REFRESH", message: "No refresh token"},
        };
    }

    const dbToken = await RefreshTokenService.findValidRefreshTokenById(refreshId);
    if (!dbToken) {
        return {
            success: false,
            status: 401,
            error: {code: "INVALID_REFRESH", message: "Invalid refresh token"},
        };
    }

    // verify plain matches hashed
    const ok = await server_verify_refresh_token_plain(refreshId, refreshPlain);
    if (!ok) {
        return {
            success: false,
            status: 401,
            error: {code: "INVALID_REFRESH", message: "Invalid refresh token"},
        };
    }

    // get user
    const {prisma} = await import("@/lib/db/prisma");
    const user = await prisma.user.findUnique({where: {id: dbToken.userId}});
    if (!user) {
        return {
            success: false,
            status: 401,
            error: {code: "USER_NOT_FOUND", message: "User not found"},
        };
    }

    // rotate refresh token
    const {randomBytes} = await import("crypto");
    const newPlain = randomBytes(48).toString("hex");
    await RefreshTokenService.rotateRefreshToken(refreshId, newPlain, user.id);

    // new access token
    const accessToken = await server_sign_access_token({
        sub: user.id,
        email: user.email,
    });

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

    const refreshValueCookie = server_serialize_cookie("refresh_token", newPlain, {
        httpOnly: true,
        secure,
        sameSite: "strict",

        maxAge: 60 * 60 * 24 * Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30),
        domain,
    });

    // fetch rotated token id
    const newest = await prisma.refreshToken.findFirst({
        where: {userId: user.id, revoked: false},
        orderBy: {createdAt: "desc"},
    });

    if (!newest) {
        return {
            success: false,
            status: 500,
            error: {code: "ROTATION_FAILED", message: "Refresh token rotation failed"},
        };
    }

    const refreshIdCookie = server_serialize_cookie("refresh_token_id", newest.id, {
        httpOnly: true,
        secure,
        sameSite: "strict",

        maxAge: 60 * 60 * 24 * Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30),
        domain,
    });

    const setCookies = [accessCookie, refreshValueCookie, refreshIdCookie].join(", ");

    return {
        success: true,
        status: 200,
        headers: {
            "Set-Cookie": setCookies,
            "Content-Type": "application/json",
        },
        data: {
            user
        },
    };

}
