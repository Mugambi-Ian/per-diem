// __tests__/auth/logout.integration.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PostAuthLogout } from '@/lib/modules/auth/logout.handler';
import {createTestRefreshToken, createTestUser, testPrisma} from "@/__tests__/db.setup";

describe('Logout Handler Integration Tests', () => {
    let user: any;
    let refreshToken: any;
    let cookieHeader: string;

    beforeEach(async () => {
        // Create a test user
        user = await createTestUser();
        // Create a refresh token for that user
        refreshToken = await createTestRefreshToken(user.id);

        // Prepare the cookie header to simulate browser cookies
        cookieHeader = `refresh_token_id=${refreshToken.id}; refresh_token=somehashedtoken;`;
    });

    it('should logout successfully and revoke refresh token', async () => {
        const req = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
            method: 'POST',
            headers: {
                cookie: cookieHeader,
                'Content-Type': 'application/json',
            },
        });

        const response = await PostAuthLogout(req);

        expect(response.success).toBe(true);
        expect(response.status).toBe(200);
        expect(response.headers?.['Set-Cookie']).toContain('access_token=;');
        expect(response.headers?.['Set-Cookie']).toContain('refresh_token=;');
        expect(response.headers?.['Set-Cookie']).toContain('refresh_token_id=;');

        // Verify in DB that the refresh token was revoked
        const dbToken = await testPrisma().refreshToken.findUnique({ where: { id: refreshToken.id } });
        expect(dbToken?.revoked).toBe(true);
    });

    it('should handle missing refresh_token_id cookie gracefully', async () => {
        const req = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const response = await PostAuthLogout(req);

        expect(response.success).toBe(true);
        expect(response.status).toBe(200);
        expect(response.headers?.['Set-Cookie']).toContain('access_token=;');
        expect(response.headers?.['Set-Cookie']).toContain('refresh_token=;');
        expect(response.headers?.['Set-Cookie']).toContain('refresh_token_id=;');
    });
});
