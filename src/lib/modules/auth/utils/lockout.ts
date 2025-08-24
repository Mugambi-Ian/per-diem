import { prisma } from "@/lib/db/prisma";
import { DateTime } from "luxon";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export interface LockoutStatus {
    isLocked: boolean;
    remainingAttempts: number;
    lockedUntil: Date | null;
    message?: string;
}

export async function checkAccountLockout(email: string): Promise<LockoutStatus> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            failedLoginAttempts: true,
            lockedUntil: true,
            lastFailedLogin: true
        }
    });

    if (!user) {
        return {
            isLocked: false,
            remainingAttempts: MAX_FAILED_ATTEMPTS,
            lockedUntil: null
        };
    }

    // Check if account is currently locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingLockTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
        return {
            isLocked: true,
            remainingAttempts: 0,
            lockedUntil: user.lockedUntil,
            message: `Account is locked. Please try again in ${remainingLockTime} minutes.`
        };
    }

    // If lockout period has expired, reset the failed attempts
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
        await prisma.user.update({
            where: { email },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastFailedLogin: null
            }
        });

        return {
            isLocked: false,
            remainingAttempts: MAX_FAILED_ATTEMPTS,
            lockedUntil: null
        };
    }

    const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - user.failedLoginAttempts);
    
    return {
        isLocked: false,
        remainingAttempts,
        lockedUntil: null,
        message: remainingAttempts < 3 ? `Warning: ${remainingAttempts} login attempts remaining` : undefined
    };
}

export async function recordFailedLogin(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { failedLoginAttempts: true }
    });

    if (!user) return;

    const newFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLockAccount = newFailedAttempts >= MAX_FAILED_ATTEMPTS;
    
    const updateData: any = {
        failedLoginAttempts: newFailedAttempts,
        lastFailedLogin: new Date()
    };

    if (shouldLockAccount) {
        updateData.lockedUntil = DateTime.now().plus({ minutes: LOCKOUT_DURATION_MINUTES }).toJSDate();
    }

    await prisma.user.update({
        where: { email },
        data: updateData
    });
}

export async function resetFailedLoginAttempts(email: string): Promise<void> {
    await prisma.user.updateMany({
        where: { email },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastFailedLogin: null
        }
    });
}

export async function getLockoutInfo(email: string): Promise<{
    failedAttempts: number;
    lockedUntil: Date | null;
    lastFailedLogin: Date | null;
}> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            failedLoginAttempts: true,
            lockedUntil: true,
            lastFailedLogin: true
        }
    });

    if (!user) {
        return {
            failedAttempts: 0,
            lockedUntil: null,
            lastFailedLogin: null
        };
    }

    return {
        failedAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
        lastFailedLogin: user.lastFailedLogin
    };
}
