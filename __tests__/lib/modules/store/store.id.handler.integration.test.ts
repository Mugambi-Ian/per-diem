// __tests__/storeId.handlers.integration.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import {createTestStore, createTestUser, testPrisma, waitForPrisma} from "@/__tests__/db.setup";
import {StoreIdDeleteHandler, StoreIdGetHandler, StoreIdPutHandler} from "@/lib/modules/stores/store.id.handler";
import {object_stringify} from "@/shared/utils/object";

describe('StoreId Handlers Integration Tests', () => {
    let testUser: any;
    let testStore: any;
    let mockRequest: NextRequest;

    beforeEach(async () => {
        await waitForPrisma();
        testUser = await createTestUser();
        testStore = await createTestStore(testUser.id);

        mockRequest = new NextRequest(`http://localhost/api/stores/${testStore.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
    });

    describe('StoreIdGetHandler', () => {
        it('should return store details successfully', async () => {
            const response = await StoreIdGetHandler(mockRequest, { id: testStore.id });
            expect(response.success).toBe(true);
            expect(response.data?.id).toBe(testStore.id);
            expect(response.data?.name).toBe(testStore.name);
        });

        it('should return 404 for non-existent store', async () => {
            const response = await StoreIdGetHandler(mockRequest, { id: 'nonexistent' });
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.message).toBe('Store not found');
        });
    });

    describe('StoreIdPutHandler', () => {
        it('should update store successfully', async () => {
            const body = { name: 'Updated Store Name', timezone: 'America/New_York' };
            mockRequest = new NextRequest(`http://localhost/api/stores/${testStore.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const jwt = { sub: testUser.id }; // Mock JWT payload

            const response = await StoreIdPutHandler(mockRequest, { id: testStore.id }, jwt);
            console.log(object_stringify(response))
            expect(response.success).toBe(true);
            expect(response.data?.name).toBe('Updated Store Name');

            const dbStore = await testPrisma().store.findUnique({ where: { id: testStore.id } });
            expect(dbStore?.name).toBe('Updated Store Name');
        });

        it('should return 400 for invalid timezone', async () => {
            const body = { name: 'Invalid Timezone Store', timezone: 'Invalid/Timezone' };
            mockRequest = new NextRequest(`http://localhost/api/stores/${testStore.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const jwt = { sub: testUser.id };
            const response = await StoreIdPutHandler(mockRequest, { id: testStore.id }, jwt);
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.message).toBe('Invalid timezone');
        });

        it('should reject update for unauthorized user', async () => {
            const body = { name: 'Hacker Store', timezone: 'America/New_York' };
            mockRequest = new NextRequest(`http://localhost/api/stores/${testStore.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const jwt = { sub: 'unauthorized-user' };
            const response = await StoreIdPutHandler(mockRequest, { id: testStore.id }, jwt);
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.message).toBe('Store not found or not owned');
        });
    });

    describe('StoreIdDeleteHandler', () => {
        it('should delete store successfully', async () => {
            const jwt = { sub: testUser.id };
            const response = await StoreIdDeleteHandler(mockRequest, { id: testStore.id }, jwt);

            expect(response.success).toBe(true);
            expect(response.data?.message).toBe('Store deleted successfully');

            const dbStore = await testPrisma().store.findUnique({ where: { id: testStore.id } });
            expect(dbStore).toBeNull();
        });

        it('should return 404 when deleting non-existent store', async () => {
            const jwt = { sub: testUser.id };
            const response = await StoreIdDeleteHandler(mockRequest, { id: 'nonexistent' }, jwt);

            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.message).toBe('Store not found or not owned');
        });

        it('should reject deletion without JWT', async () => {
            const response = await StoreIdDeleteHandler(mockRequest, { id: testStore.id }, undefined);
            expect(response.success).toBe(false);
            expect(response.status).toBe(401);
            expect(response.error.message).toBe('UNAUTHORIZED');
        });
    });
});
