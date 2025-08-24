// __tests__/auth.login.integration.test.ts
import {describe, it, expect, beforeEach} from '@jest/globals';
import {NextRequest} from 'next/server';
import {PostAuthLogin} from '@/lib/modules/auth/login.handler';
import {createTestUser, testPrisma} from "@/__tests__/db.setup";
import {server_hash_password} from "@/lib/modules/auth/utils/password";

const password = '1Password-placeholder';

describe('Login Handler Integration Tests', () => {
    let mockRequest: NextRequest;

    beforeEach(() => {
        // Reset mock request for each test
        mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        });
    });

    describe('Successful Login', () => {
        it('should login successfully with correct credentials', async () => {

            const user = await createTestUser({passwordHash: await server_hash_password(password)});
            const body = {
                password,
                email: user.email,
            };


            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });

            const response = await PostAuthLogin(mockRequest);
            console.log(response)
            expect(response.success).toBe(true);
            expect(response.status).toBe(201);
            expect(response.data?.user).toBeDefined();
            expect(response.data?.user?.email).toBe(user.email);
            expect(response.headers?.['Set-Cookie']).toContain('access_token');
            expect(response.headers?.['Set-Cookie']).toContain('refresh_token');
            expect(response.headers?.['Set-Cookie']).toContain('refresh_token_id');
        });

        it('should update timezone if provided', async () => {
            const user = await createTestUser({
                timezone: 'America/New_York',
                passwordHash: await server_hash_password(password)
            });

            const body = {email: user.email, password, timezone: 'Africa/Nairobi'};
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });

            await PostAuthLogin(mockRequest);

            const updatedUser = await testPrisma().user.findUnique({where: {email: user.email}});
            expect(updatedUser?.timezone).toBe('Africa/Nairobi');
        });
    });

    describe('Failed Login', () => {
        it('should fail with invalid credentials', async () => {
            const user = await createTestUser();

            const body = {email: user.email, password: 'wrongpassworD1!'};
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });

            const response = await PostAuthLogin(mockRequest);
            expect(response.success).toBe(false);
            expect(response.status).toBe(401);
            expect(response.error.code).toBe('AUTHENTICATION_FAILED');
        });

        it('should fail with non-existent email', async () => {
            const body = {email: 'nonexistent@example.com', password: 'any-passworD!1'};
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });

            const response = await PostAuthLogin(mockRequest);
            expect(response.success).toBe(false);
            expect(response.status).toBe(401);
            expect(response.error.code).toBe('AUTHENTICATION_FAILED');
        });

        it('should handle account lockout', async () => {
            const email = 'elmlmew@ddd.com';
            const user = await createTestUser({
                    email,
                    failedLoginAttempts: 5,
                    lastFailedLogin: new Date(),

                passwordHash:await server_hash_password(password),
                    lockedUntil: new Date(Date.now() + 60_000)
                }
            );

            const body = {email: user.email, password};
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });

            const response = await PostAuthLogin(mockRequest);
            expect(response.success).toBe(false);
            expect(response.status).toBe(423);
            expect(response.error.code).toBe('ACCOUNT_LOCKED');
            expect(response.error.details).toHaveProperty('lockedUntil');
            expect(response.error.details).toHaveProperty('remainingAttempts');
        });
    });

    describe('Request Validation', () => {
        it('should handle malformed JSON', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: 'invalid-json',
            });

            await expect(PostAuthLogin(mockRequest)).rejects.toThrow();
        });

        it('should handle empty request body', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: '',
            });

            await expect(PostAuthLogin(mockRequest)).rejects.toThrow();
        });
    });
})
;
