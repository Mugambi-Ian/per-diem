import {describe, it, expect} from '@jest/globals';
import {createTestUser, createTestRefreshToken,testPrisma} from '@/__tests__/db.setup';
import * as argon2 from "argon2";
import {RefreshTokenService} from "@/lib/modules/auth/service/refresh.service";

describe('RefreshTokenService Integration Tests', () => {


    describe('findValidRefreshTokenById', () => {
        it('should return valid refresh token', async () => {
            const user = await createTestUser({
                email: `valid-token-${Date.now()}@example.com`,
                fullName: 'Valid Token User'
            });

            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
            const token = await createTestRefreshToken(user.id, {
                revoked: false,
                expiresAt: futureDate
            });

            const result = await RefreshTokenService.findValidRefreshTokenById(token.id);

            expect(result).toBeDefined();
            expect(result?.id).toBe(token.id);
            expect(result?.userId).toBe(user.id);
            expect(result?.revoked).toBe(false);
            expect(result?.expiresAt).toEqual(futureDate);
        });

        it('should return null for revoked token', async () => {
            const user = await createTestUser({
                email: `revoked-token-${Date.now()}@example.com`,
                fullName: 'Revoked Token User'
            });

            const token = await createTestRefreshToken(user.id, {
                revoked: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            const result = await RefreshTokenService.findValidRefreshTokenById(token.id);

            expect(result).toBeNull();
        });

        it('should return null for expired token', async () => {
            const user = await createTestUser({
                email: `expired-token-${Date.now()}@example.com`,
                fullName: 'Expired Token User'
            });

            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
            const token = await createTestRefreshToken(user.id, {
                revoked: false,
                expiresAt: pastDate
            });

            const result = await RefreshTokenService.findValidRefreshTokenById(token.id);

            expect(result).toBeNull();
        });

        it('should return null for non-existent token', async () => {
            const nonExistentId = 'non-existent-token-id';

            const result = await RefreshTokenService.findValidRefreshTokenById(nonExistentId);

            expect(result).toBeNull();
        });

        it('should return null for token that is both revoked and expired', async () => {
            const user = await createTestUser({
                email: `revoked-expired-${Date.now()}@example.com`,
                fullName: 'Revoked Expired User'
            });

            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
            const token = await createTestRefreshToken(user.id, {
                revoked: true,
                expiresAt: pastDate
            });

            const result = await RefreshTokenService.findValidRefreshTokenById(token.id);

            expect(result).toBeNull();
        });
    });

    describe('rotateRefreshToken', () => {
        it('should rotate refresh token successfully', async () => {
            const user = await createTestUser({
                email: `rotate-token-${Date.now()}@example.com`,
                fullName: 'Rotate Token User'
            });

            const oldToken = await createTestRefreshToken(user.id, {
                revoked: false,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            const newPlainToken = `new-token-${Date.now()}`;
            const beforeRotation = new Date();

            const result = await RefreshTokenService.rotateRefreshToken(
                oldToken.id,
                newPlainToken,
                user.id
            );

            expect(result).toBeDefined();
            expect(result.expiresAt).toBeInstanceOf(Date);
            expect(result.expiresAt.getTime()).toBeGreaterThan(beforeRotation.getTime());

            // Verify old token was revoked
            const revokedToken = await testPrisma().refreshToken.findUnique({
                where: { id: oldToken.id }
            });
            expect(revokedToken?.revoked).toBe(true);

            // Verify new token was created
            const newTokens = await testPrisma().refreshToken.findMany({
                where: {
                    userId: user.id,
                    rotatedFrom: oldToken.id,
                    revoked: false
                }
            });

            expect(newTokens).toHaveLength(1);
            const newToken = newTokens[0];
            expect(newToken.userId).toBe(user.id);
            expect(newToken.rotatedFrom).toBe(oldToken.id);
            expect(newToken.revoked).toBe(false);
            expect(newToken.expiresAt).toEqual(result.expiresAt);
        });

        it('should hash the new token correctly', async () => {
            const user = await createTestUser({
                email: `hash-token-${Date.now()}@example.com`,
                fullName: 'Hash Token User'
            });

            const oldToken = await createTestRefreshToken(user.id, { revoked: false });

            const newPlainToken = `new-plain-token-${Date.now()}`;

            await RefreshTokenService.rotateRefreshToken(
                oldToken.id,
                newPlainToken,
                user.id
            );

            // Find the new token
            const newTokens = await testPrisma().refreshToken.findMany({
                where: {
                    userId: user.id,
                    rotatedFrom: oldToken.id,
                    revoked: false
                }
            });

            expect(newTokens).toHaveLength(1);
            const newToken = newTokens[0];

            // ✅ Correct verification
            const isValid = await argon2.verify(newToken.tokenHash, newPlainToken);
            expect(isValid).toBe(true);

            // Ensure plaintext is not stored
            expect(newToken.tokenHash).not.toBe(newPlainToken);
        });

        it('should set correct expiration date based on environment variable', async () => {
            const user = await createTestUser({
                email: `expiry-token-${Date.now()}@example.com`,
                fullName: 'Expiry Token User'
            });

            const oldToken = await createTestRefreshToken(user.id, {
                revoked: false
            });

            const newPlainToken = `new-expiry-token-${Date.now()}`;
            const beforeRotation = new Date();

            const result = await RefreshTokenService.rotateRefreshToken(
                oldToken.id,
                newPlainToken,
                user.id
            );

            // Default is 30 days if JWT_REFRESH_EXPIRES_DAYS is not set
            const expectedExpiryDays = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30);
            const expectedExpiry = new Date(beforeRotation.getTime() + expectedExpiryDays * 24 * 60 * 60 * 1000);

            // Allow for small time differences during test execution
            const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime());
            expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
        });

        it('should handle rotation atomically (transaction)', async () => {
            const user = await createTestUser({
                email: `atomic-token-${Date.now()}@example.com`,
                fullName: 'Atomic Token User'
            });

            const oldToken = await createTestRefreshToken(user.id, {
                revoked: false
            });

            const newPlainToken = `atomic-token-${Date.now()}`;

            await RefreshTokenService.rotateRefreshToken(
                oldToken.id,
                newPlainToken,
                user.id
            );

            // Count total tokens for this user
            const allTokens = await testPrisma().refreshToken.findMany({
                where: { userId: user.id }
            });

            // Should have exactly 2 tokens: 1 revoked (old) + 1 new
            expect(allTokens).toHaveLength(2);

            const revokedTokens = allTokens.filter((t: { revoked: any; }) => t.revoked);
            const activeTokens = allTokens.filter((t: { revoked: any; }) => !t.revoked);

            expect(revokedTokens).toHaveLength(1);
            expect(activeTokens).toHaveLength(1);
            expect(revokedTokens[0].id).toBe(oldToken.id);
            expect(activeTokens[0].rotatedFrom).toBe(oldToken.id);
        });

        it('should handle rotation with different user IDs', async () => {
            const user1 = await createTestUser({
                email: `user1-${Date.now()}@example.com`,
                fullName: 'User 1'
            });

            const user2 = await createTestUser({
                email: `user2-${Date.now()}@example.com`,
                fullName: 'User 2'
            });

            const oldToken = await createTestRefreshToken(user1.id, {
                revoked: false
            });

            const newPlainToken = `cross-user-token-${Date.now()}`;

            await RefreshTokenService.rotateRefreshToken(
                oldToken.id,
                newPlainToken,
                user2.id // Different user ID
            );

            // Verify old token (user1) was revoked
            const revokedToken = await testPrisma().refreshToken.findUnique({
                where: { id: oldToken.id }
            });
            expect(revokedToken?.revoked).toBe(true);
            expect(revokedToken?.userId).toBe(user1.id);

            // Verify new token belongs to user2
            const newTokens = await testPrisma().refreshToken.findMany({
                where: {
                    rotatedFrom: oldToken.id,
                    revoked: false
                }
            });

            expect(newTokens).toHaveLength(1);
            expect(newTokens[0].userId).toBe(user2.id);
        });

        it('should handle rotation of non-existent token', async () => {
            const user = await createTestUser({
                email: `nonexistent-rotate-${Date.now()}@example.com`,
                fullName: 'Non-existent Rotate User'
            });

            const nonExistentTokenId = 'non-existent-token-id';
            const newPlainToken = `new-token-${Date.now()}`;

            // This should still work - the update will affect 0 rows but not throw
            const result = await RefreshTokenService.rotateRefreshToken(
                nonExistentTokenId,
                newPlainToken,
                user.id
            );

            expect(result).toBeDefined();
            expect(result.expiresAt).toBeInstanceOf(Date);

            // Verify new token was still created
            const newTokens = await testPrisma().refreshToken.findMany({
                where: {
                    userId: user.id,
                    rotatedFrom: nonExistentTokenId,
                    revoked: false
                }
            });

            expect(newTokens).toHaveLength(1);
        });
    });

    describe('Integration between findValidRefreshTokenById and rotateRefreshToken', () => {
        it('should find valid token before rotation and not find old token after rotation', async () => {
            const user = await createTestUser({
                email: `integration-${Date.now()}@example.com`,
                fullName: 'Integration User'
            });

            const oldToken = await createTestRefreshToken(user.id, {
                revoked: false,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            // Should find valid token before rotation
            const beforeRotation = await RefreshTokenService.findValidRefreshTokenById(oldToken.id);
            expect(beforeRotation).toBeDefined();
            expect(beforeRotation?.id).toBe(oldToken.id);

            // Rotate the token
            const newPlainToken = `integration-token-${Date.now()}`;
            await RefreshTokenService.rotateRefreshToken(
                oldToken.id,
                newPlainToken,
                user.id
            );

            // Should not find old token after rotation (it's revoked)
            const afterRotation = await RefreshTokenService.findValidRefreshTokenById(oldToken.id);
            expect(afterRotation).toBeNull();

            // Should be able to find the new token
            const newTokens = await testPrisma().refreshToken.findMany({
                where: {
                    userId: user.id,
                    rotatedFrom: oldToken.id,
                    revoked: false
                }
            });

            expect(newTokens).toHaveLength(1);
            const newToken = await RefreshTokenService.findValidRefreshTokenById(newTokens[0].id);
            expect(newToken).toBeDefined();
            expect(newToken?.id).toBe(newTokens[0].id);
        });
    });
});