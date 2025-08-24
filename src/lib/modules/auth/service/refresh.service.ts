import {server_hash_refresh_token} from "@/lib/modules/auth/utils/token";
import {prisma} from "@/lib/db/prisma";


const REFRESH_EXPIRES_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30);

async function rotateRefreshToken(oldTokenId: string, newPlainToken: string, userId: string) {
    const tokenHash = await server_hash_refresh_token(newPlainToken);
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 3600 * 1000);

    // mark old token revoked and create new with rotatedFrom
    await prisma.$transaction(async (tx: {
        refreshToken: {
            update: (arg0: { where: { id: string; }; data: { revoked: boolean; }; }) => any;
            create: (arg0: {
                data: { userId: string; tokenHash: string; expiresAt: Date; rotatedFrom: string; };
            }) => any;
        };
    }) => {
        // @ts-expect-error many
        await tx.refreshToken.updateMany({
            where: { id: oldTokenId },
            data: { revoked: true },
        });

        await tx.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
                rotatedFrom: oldTokenId,
            },
        });
    });

    return {expiresAt};
}

async function findValidRefreshTokenById(id: string) {
    const t = await prisma.refreshToken.findUnique({where: {id}});
    if (!t || t.revoked || t.expiresAt < new Date()) return null;
    return t;
}

export const RefreshTokenService = {findValidRefreshTokenById, rotateRefreshToken}

