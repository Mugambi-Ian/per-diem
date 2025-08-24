// __tests__/auth.refresh.integration.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PostAuthRefresh } from '@/lib/modules/auth/refresh.handler';
import { server_hash_refresh_token } from '@/lib/modules/auth/utils/token';
import * as crypto from 'crypto';
import {createTestRefreshToken, createTestUser, testPrisma, waitForPrisma} from "@/__tests__/db.setup";

describe('PostAuthRefresh Integration Tests', () => {
    let user: any;
    let oldToken: any;
    let refreshPlain: string;
    let cookieHeader: string;

    beforeEach(async () => {
        // Ensure Prisma is ready
        await waitForPrisma();

        // Create a test user
        user = await createTestUser();

        // Generate plain token and hash
        refreshPlain = crypto.randomBytes(48).toString('hex');
        const tokenHash = await server_hash_refresh_token(refreshPlain);

        // Create refresh token in DB
        oldToken = await createTestRefreshToken(user.id, { tokenHash });

        // Build cookie header
        cookieHeader = `refresh_token_id=${oldToken.id}; refresh_token=${refreshPlain}`;
    });

    it('should successfully refresh tokens', async () => {
        const req = new NextRequest('http://localhost/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                cookie: cookieHeader,
            },
        });

        const response = await PostAuthRefresh(req);

        expect(response.success).toBe(true);
        expect(response.status).toBe(200);
        expect(response.data?.user.id).toBe(user.id);
        expect(response.headers?.['Set-Cookie']).toContain('access_token=');
        expect(response.headers?.['Set-Cookie']).toContain('refresh_token=');
        expect(response.headers?.['Set-Cookie']).toContain('refresh_token_id=');

        // Verify old token is revoked
        const dbOld = await testPrisma().refreshToken.findUnique({ where: { id: oldToken.id } });
        expect(dbOld?.revoked).toBe(true);

        // Verify new token exists
        const newToken = await testPrisma().refreshToken.findFirst({
            where: { userId: user.id, revoked: false },
            orderBy: { createdAt: 'desc' },
        });
        expect(newToken).toBeDefined();
        expect(newToken?.id).not.toBe(oldToken.id);
    });

    it('should return 401 if no cookies present', async () => {
        const req = new NextRequest('http://localhost/api/v1/auth/refresh', { method: 'POST' });
        const response = await PostAuthRefresh(req);

        expect(response.success).toBe(false);
        expect(response.status).toBe(401);
        expect(response.error.code).toBe('NO_REFRESH');
    });

    it('should return 401 for invalid token', async () => {
        const req = new NextRequest('http://localhost/api/v1/auth/refresh', {
            method: 'POST',
            headers: { cookie: `refresh_token_id=${oldToken.id}; refresh_token=invalid` },
        });

        const response = await PostAuthRefresh(req);

        expect(response.success).toBe(false);
        expect(response.status).toBe(401);
        expect(response.error.code).toBe('INVALID_REFRESH');
    });

    it('should return 401 if user does not exist', async () => {
        // Delete user
        await testPrisma().user.delete({ where: { id: user.id } });

        const req = new NextRequest('http://localhost/api/v1/auth/refresh', {
            method: 'POST',
            headers: { cookie: cookieHeader },
        });

        const response = await PostAuthRefresh(req);
        expect(response.success).toBe(false);
        expect(response.status).toBe(401);
        expect(response.error.code).toBe('INVALID_REFRESH');
    });

    it('should fail if refresh token rotation fails', async () => {
        // Simulate rotation failure by deleting token before refresh
        await testPrisma().refreshToken.delete({ where: { id: oldToken.id } });

        const req = new NextRequest('http://localhost/api/v1/auth/refresh', {
            method: 'POST',
            headers: { cookie: cookieHeader },
        });

        const response = await PostAuthRefresh(req);
        expect(response.success).toBe(false);
        expect(response.status).toBe(401);
        expect(response.error.code).toBe('INVALID_REFRESH');
    });
});
