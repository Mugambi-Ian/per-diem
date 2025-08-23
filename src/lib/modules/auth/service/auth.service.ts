// lib/auth/auth.service.ts
import {prisma} from "@/lib/db/prisma";
import {server_generate_refresh_token, server_hash_refresh_token} from "@/lib/modules/auth/utils/token";
import {server_verify_password} from "@/lib/modules/auth/utils/password";
import {server_sign_access_token} from "@/lib/modules/auth/utils/jwt";
import {server_hash_password} from "@/lib/modules/auth/utils/password";
import {schema_register} from "@/lib/modules/auth/schema/register";


async function register({ email, password,fullName }: ReturnType<typeof schema_register.parse>) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("User already exists");

    const passwordHash = await server_hash_password(password);
    const user = await prisma.user.create({
        data: { email, passwordHash,fullName },
    });
    return { id: user.id, email: user.email };
}


const REFRESH_EXPIRES_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30);
async function login({ email, password }: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const ok = await server_verify_password(user.passwordHash, password);
    if (!ok) throw new Error("Invalid credentials");

    // sign access token payload (light)
    const accessToken = await server_sign_access_token({ sub: user.id, email: user.email });

    // create refresh token (opaque)
    const refreshTokenPlain = server_generate_refresh_token();
    const tokenHash = await server_hash_refresh_token(refreshTokenPlain);

    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 3600 * 1000);

    const dbToken = await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt,
        },
    });

    return {
        expiresAt,
        accessToken,
        refreshTokenPlain, // return to caller to set cookie
        refreshTokenId: dbToken.id,
        user: { id: user.id, email: user.email },
    };
}

export async function logout(id: string) {
    await prisma.refreshToken.updateMany({ where: { id }, data: { revoked: true } });
}
export const AuthService ={register,login,logout};
