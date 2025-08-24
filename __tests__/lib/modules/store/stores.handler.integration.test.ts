// __tests__/stores.integration.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { JWTPayload } from 'jose';
import {createTestStore, createTestUser, isLoaded, testPrisma} from "@/__tests__/db.setup";
import {StoresGetHandler, StoresPostHandler} from "@/lib/modules/stores/stores.handler";

describe('Stores Handlers Integration Tests', () => {
    let testUser: any;
    let jwtPayload: JWTPayload;

    beforeEach(async () => {
        // Ensure DB is loaded
        await isLoaded();

        // Create a fresh test user for each test
        testUser = await createTestUser();

        // Minimal JWT payload
        jwtPayload = { sub: testUser.id } as JWTPayload;
    });

    describe('StoresGetHandler', () => {
        it('should return a list of stores', async () => {
            // Create some test stores
            const store1 = await createTestStore(testUser.id);
            const store2 = await createTestStore(testUser.id);

            const req = new NextRequest(`http://localhost:3000/api/v1/stores`, {
                method: 'GET',
                headers: { 'x-user-timezone': 'Africa/Nairobi' },
            });

            const response = await StoresGetHandler(req);

            expect(response.success).toBe(true);
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data?.payload)).toBe(true);
            expect(response.data?.payload?.length).toBeGreaterThanOrEqual(2);
            const storeIds = response.data?.payload?.map((s: any) => s.id);
            expect(storeIds).toContain(store1.id);
            expect(storeIds).toContain(store2.id);
        });

        it('should return 400 for invalid query params', async () => {
            const req = new NextRequest(`http://localhost:3000/api/v1/stores?limit=notanumber`, {
                method: 'GET',
            });

            const response = await StoresGetHandler(req);

            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error?.code).toBe('INVALID_QUERY');
        });
    });

    describe('StoresPostHandler', () => {
        it('should create a new store successfully', async () => {
            const body = {
                name: 'New Store',
                slug: 'new-store',
                address: '123 Test St',
                timezone: 'Africa/Nairobi',
                lat: 1.234,
                lng: 36.789,
                operatingHours: [{ dayOfWeek: 1, openTime: '09:00', closeTime: '17:00' }],
            };

            const req = new NextRequest(`http://localhost:3000/api/v1/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const response = await StoresPostHandler(req, {}, jwtPayload);
            console.log(response)
            expect(response.success).toBe(true);
            expect(response.data).toBeDefined();
            expect(response.data?.id).toBeDefined();

            // Verify store exists in DB
            const dbStore = await testPrisma().store.findUnique({
                where: { id: response.data?.id },
            });
            expect(dbStore).toBeDefined();
            expect(dbStore?.name).toBe('New Store');
        });

        it('should return 400 for invalid timezone', async () => {
            const body = {
                name: 'Bad TZ Store',
                slug: 'bad-tz-store',
                address: '123 Test St',
                timezone: 'Invalid/Timezone',
                lat: 0,
                lng: 0,
                operatingHours: [{ day: 'mon', open: '09:00', close: '17:00' }],
            };

            const req = new NextRequest(`http://localhost:3000/api/v1/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const response = await StoresPostHandler(req, {}, jwtPayload);

            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error?.code).toBe('INVALID_BODY');
        });

        it('should return 400 for invalid operating hours', async () => {
            const body = {
                name: 'Bad Hours Store',
                slug: 'bad-hours-store',
                address: '123 Test St',
                timezone: 'Africa/Nairobi',
                lat: 0,
                lng: 0,
                operatingHours: [{ day: 'mon', open: '17:00', close: '09:00' }], // invalid
            };

            const req = new NextRequest(`http://localhost:3000/api/v1/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const response = await StoresPostHandler(req, {}, jwtPayload);

            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error?.code).toBe('INVALID_BODY');
        });

        it('should return 400 for invalid body schema', async () => {
            const body = {
                name: '', // required field empty
            };

            const req = new NextRequest(`http://localhost:3000/api/v1/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const response = await StoresPostHandler(req, {}, jwtPayload);

            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error?.code).toBe('INVALID_BODY');
        });
    });
});
