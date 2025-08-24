import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { UserTimezonePutHandler } from '@/lib/modules/user/user.timezone.handler';
import { createTestUser, testPrisma } from "@/__tests__/db.setup";
import { server_hash_password } from "@/lib/modules/auth/utils/password";

const password = '1Password-placeholder';

describe('User Timezone Handler Integration Tests', () => {
    let mockRequest: NextRequest;
    let testUser: any;

    beforeEach(async () => {
        // Create test user with default timezone
        testUser = await createTestUser({ 
            passwordHash: await server_hash_password(password),
            timezone: 'America/New_York'
        });
    });

    describe('PUT /api/v1/user/timezone - Update User Timezone', () => {
        it('should update user timezone successfully', async () => {
            const timezoneData = {
                timezone: 'Europe/London'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.status).toBe(200);
            expect(response.data?.user).toBeDefined();
            expect(response.data?.user.timezone).toBe('Europe/London');

            // Verify database was updated
            const updatedUser = await testPrisma().user.findUnique({ where: { id: testUser.id } });
            expect(updatedUser?.timezone).toBe('Europe/London');
        });

        it('should update timezone to UTC', async () => {
            const timezoneData = {
                timezone: 'UTC'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.user.timezone).toBe('UTC');
        });

        it('should update timezone to Asia/Tokyo', async () => {
            const timezoneData = {
                timezone: 'Asia/Tokyo'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.user.timezone).toBe('Asia/Tokyo');
        });

        it('should update timezone to Australia/Sydney', async () => {
            const timezoneData = {
                timezone: 'Australia/Sydney'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.user.timezone).toBe('Australia/Sydney');
        });

        it('should fail with invalid timezone format', async () => {
            const timezoneData = {
                timezone: 'Invalid/Timezone'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('INVALID_BODY');
        });

        it('should fail with empty timezone', async () => {
            const timezoneData = {
                timezone: ''
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('INVALID_BODY');
        });

        it('should fail with malformed timezone', async () => {
            const timezoneData = {
                timezone: 'NotA/Valid/Timezone'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('INVALID_BODY');
        });

        it('should fail without authentication', async () => {
            const timezoneData = {
                timezone: 'Europe/London'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, undefined);
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(401);
            expect(response.error.code).toBe('UNAUTHORIZED');
        });

        it('should handle DST-aware timezones', async () => {
            const timezoneData = {
                timezone: 'America/Los_Angeles' // Has DST transitions
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.user.timezone).toBe('America/Los_Angeles');
        });

        it('should handle timezones with special characters', async () => {
            const timezoneData = {
                timezone: 'America/New_York' // Contains underscore
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.user.timezone).toBe('America/New_York');
        });

        it('should preserve other user data when updating timezone', async () => {
            const timezoneData = {
                timezone: 'Europe/Paris'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/user/timezone', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timezoneData),
            });

            const response = await UserTimezonePutHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.user.email).toBe(testUser.email);
            expect(response.data?.user.fullName).toBe(testUser.fullName);
            expect(response.data?.user.avocado).toBe(testUser.avocado);
            expect(response.data?.user.timezone).toBe('Europe/Paris');
        });
    });
});
