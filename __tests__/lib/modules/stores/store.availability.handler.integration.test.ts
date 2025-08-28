// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { StoreAvailabilityGetHandler } from '@/lib/modules/stores/store.availability.handler';
import { createTestUser, createTestStore, testPrisma } from "@/__tests__/db.setup";
import { server_hash_password } from "@/lib/modules/auth/utils/password";

const password = '1Password-placeholder';

describe('Store Availability Handler Integration Tests', () => {
    let mockRequest: NextRequest;
    let testUser: any;
    let testStore: any;

    beforeEach(async () => {
        // Create test user and store
        testUser = await createTestUser({ passwordHash: await server_hash_password(password) });
        testStore = await createTestStore(testUser.id, {
            timezone: 'America/New_York',
            lat: 40.7128,
            lng: -74.0060
        });

        // Create operating hours for the store
        await testPrisma().operatingHour.createMany({
            data: [
                {
                    storeId: testStore.id,
                    dayOfWeek: 1, // Monday
                    openTime: '09:00',
                    closeTime: '17:00',
                    isOpen: true,
                    closesNextDay: false,
                    dstAware: true
                },
                {
                    storeId: testStore.id,
                    dayOfWeek: 2, // Tuesday
                    openTime: '09:00',
                    closeTime: '17:00',
                    isOpen: true,
                    closesNextDay: false,
                    dstAware: true
                },
                {
                    storeId: testStore.id,
                    dayOfWeek: 3, // Wednesday
                    openTime: '09:00',
                    closeTime: '17:00',
                    isOpen: true,
                    closesNextDay: false,
                    dstAware: true
                },
                {
                    storeId: testStore.id,
                    dayOfWeek: 4, // Thursday
                    openTime: '09:00',
                    closeTime: '17:00',
                    isOpen: true,
                    closesNextDay: false,
                    dstAware: true
                },
                {
                    storeId: testStore.id,
                    dayOfWeek: 5, // Friday
                    openTime: '09:00',
                    closeTime: '17:00',
                    isOpen: true,
                    closesNextDay: false,
                    dstAware: true
                },
                {
                    storeId: testStore.id,
                    dayOfWeek: 6, // Saturday
                    openTime: '10:00',
                    closeTime: '16:00',
                    isOpen: true,
                    closesNextDay: false,
                    dstAware: true
                },
                {
                    storeId: testStore.id,
                    dayOfWeek: 0, // Sunday
                    openTime: '10:00',
                    closeTime: '16:00',
                    isOpen: false,
                    closesNextDay: false,
                    dstAware: true
                }
            ]
        });
    });

    describe('GET /api/v1/stores/[id]/availability - Check Store Availability', () => {
        it('should check store availability successfully', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability`, {
                method: 'GET',
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: testStore.id });
            
            expect(response.success).toBe(true);
            expect(response.status).toBe(200);
            expect(response.data?.availability).toBeDefined();
            expect(response.data?.availability.storeId).toBe(testStore.id);
            expect(response.data?.availability.storeName).toBe(testStore.name);
            expect(response.data?.availability.timezone).toBe('America/New_York');
            expect(response.data?.availability.currentLocalTime).toBeDefined();
            expect(response.data?.availability.isCurrentlyOpen).toBeDefined();
            expect(response.data?.availability.checkedAt).toBeDefined();
        });

        it('should check availability for specific date', async () => {
            const specificDate = '2025-01-20'; // Monday
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability?date=${specificDate}`, {
                method: 'GET',
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: testStore.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.checkedAt).toContain(specificDate);
        });

        it('should check availability for specific time', async () => {
            const specificTime = '14:30';
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability?time=${specificTime}`, {
                method: 'GET',
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: testStore.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.checkedTime).toBe(specificTime);
        });

        it('should include next open time when store is closed', async () => {
            // Set store to closed (Sunday)
            const sundayDate = '2025-01-19'; // Sunday
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability?date=${sundayDate}&includeNextOpen=true`, {
                method: 'GET',
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: testStore.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.isCurrentlyOpen).toBe(false);
            expect(response.data?.availability.nextOpenTime).toBeDefined();
        });

        it('should include DST information when user timezone differs', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability?includeDSTInfo=true`, {
                method: 'GET',
                headers: {
                    'x-user-timezone': 'Europe/London'
                }
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: testStore.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.timezoneInfo).toBeDefined();
            expect(response.data?.availability.timezoneInfo.userTimezone).toBe('Europe/London');
            expect(response.data?.availability.timezoneInfo.storeTimezone).toBe('America/New_York');
            expect(response.data?.availability.timezoneInfo.userCurrentTime).toBeDefined();
            expect(response.data?.availability.timezoneInfo.storeCurrentTime).toBeDefined();
        });

        it('should handle overnight hours correctly', async () => {
            // Create a store with overnight hours
            const overnightStore = await createTestStore(testUser.id, {
                name: '24/7 Store',
                slug: 'overnight-store',
                timezone: 'America/Los_Angeles'
            });

            await testPrisma().operatingHour.create({
                data: {
                    storeId: overnightStore.id,
                    dayOfWeek: 1, // Monday
                    openTime: '22:00',
                    closeTime: '02:00',
                    isOpen: true,
                    closesNextDay: true,
                    dstAware: true
                }
            });

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${overnightStore.id}/availability`, {
                method: 'GET',
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: overnightStore.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability).toBeDefined();
        });

        it('should fail with invalid store ID', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/stores/invalid-store-id/availability', {
                method: 'GET',
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: 'invalid-store-id' });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.code).toBe('STORE_NOT_FOUND');
        });

        it('should handle missing store ID parameter', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability`, {
                method: 'GET',
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, {});
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('MISSING_ID');
        });

        it('should handle invalid date parameter', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability?date=invalid-date`, {
                method: 'GET',
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: testStore.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('INVALID_QUERY');
        });

        it('should handle invalid time parameter', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability?time=25:00`, {
                method: 'GET',
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: testStore.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('INVALID_QUERY');
        });

        it('should handle timezone headers correctly', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability`, {
                method: 'GET',
                headers: {
                    'x-timezone': 'Asia/Tokyo'
                }
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: testStore.id });
            
            expect(response.success).toBe(true);
            // The response should include timezone info since user timezone differs from store timezone
            expect(response.data?.availability.timezoneInfo).toBeDefined();
        });

        it('should handle multiple timezone header variations', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/availability`, {
                method: 'GET',
                headers: {
                    'timezone': 'Europe/Paris'
                }
            });

            const response = await StoreAvailabilityGetHandler(mockRequest, { id: testStore.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.timezoneInfo).toBeDefined();
        });
    });
});
