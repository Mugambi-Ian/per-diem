// lib/auth/auth.service.ts
import {prisma} from "@/lib/db/prisma";
import {server_generate_refresh_token, server_hash_refresh_token} from "@/lib/modules/auth/utils/token";
import {server_verify_password} from "@/lib/modules/auth/utils/password";
import {server_sign_access_token} from "@/lib/modules/auth/utils/jwt";
import {server_hash_password} from "@/lib/modules/auth/utils/password";
import {schema_register} from "@/lib/modules/auth/schema/register";
import { checkAccountLockout, recordFailedLogin, resetFailedLoginAttempts } from "@/lib/modules/auth/utils/lockout";
import { logger } from "@/lib/utils/logger";
import {UserResponseDTO} from "@/lib/modules/auth/schema/user";

async function register({ email, password, fullName, timezone }: ReturnType<typeof schema_register.parse>) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("User already exists");

    const passwordHash = await server_hash_password(password);
    const user = await prisma.user.create({
        data: { 
            email, 
            passwordHash, 
            fullName,
            ...(timezone && { timezone })
        },
    });
    
    logger.info({ userId: user.id, email }, "New user registered");
    return { id: user.id, email: user.email };
}

const REFRESH_EXPIRES_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30);

async function login({ email, password, timezone }: { email: string; password: string; timezone?: string }) {
    // Check account lockout status first
    const lockoutStatus = await checkAccountLockout(email);
    
    if (lockoutStatus.isLocked) {
        logger.warn({ email, reason: "account_locked" }, "Login attempt on locked account");
        throw new Error(lockoutStatus.message || "Account is temporarily locked");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        // Record failed attempt even for non-existent users to prevent enumeration
        await recordFailedLogin(email);
        logger.warn({ email, reason: "user_not_found" }, "Login attempt with non-existent email");
        throw new Error("Invalid credentials");
    }

    const ok = await server_verify_password(user.passwordHash, password);
    if (!ok) {
        await recordFailedLogin(email);
        logger.warn({ userId: user.id, email, reason: "invalid_password" }, "Failed login attempt");
        throw new Error("Invalid credentials");
    }

    // Successful login - reset failed attempts and update timezone if provided
    await resetFailedLoginAttempts(email);
    
    if (timezone) {
        await prisma.user.updateMany({
            where: { id: user.id },
            data: { timezone }
        });
    }

    const accessToken = await server_sign_access_token({ sub: user.id, email: user.email });

    const refreshTokenPlain = server_generate_refresh_token();
    const tokenHash = await server_hash_refresh_token(refreshTokenPlain);

    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 3600 * 1000);
    const dbToken = await prisma.refreshToken.create({
        data: {
            user: {
                connect: { id: user.id }
            },
            tokenHash,
            expiresAt,
        },
    });

    logger.info({ userId: user.id, email }, "User logged in successfully");

    return {
        expiresAt,
        accessToken,
        refreshTokenPlain, // return to caller to set cookie
        refreshTokenId: dbToken.id,
        user: { id: user.id, email: user.email },
    };
}

async function logout(id: string) {
    await prisma.refreshToken.updateMany({ where: { id }, data: { revoked: true } });
    logger.info({ refreshTokenId: id }, "User logged out");
}

async function userByID(id:string){
    return     await prisma.user.findFirst({ where: { id },select:UserResponseDTO});

}

export const AuthService = { register, login, logout ,userByID};
