import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { ProductAvailabilityGetHandler } from '@/lib/modules/product/product.availability.handler';
import { createTestUser, createTestStore, createTestProduct, testPrisma } from "@/__tests__/db.setup";
import { server_hash_password } from "@/lib/modules/auth/utils/password";

const password = '1Password-placeholder';

describe('Product Availability Handler Integration Tests', () => {
    let mockRequest: NextRequest;
    let testUser: any;
    let testStore: any;
    let testProduct: any;

    beforeEach(async () => {
        // Create test user, store, and product
        testUser = await createTestUser({ passwordHash: await server_hash_password(password) });
        testStore = await createTestStore(testUser.id, {
            timezone: 'America/New_York'
        });
        testProduct = await createTestProduct(testStore.id);

        // Create product availability windows
        await testPrisma().productAvailability.createMany({
            data: [
                {
                    productId: testProduct.id,
                    dayOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
                    startTime: '08:00',
                    endTime: '18:00',
                    timezone: 'America/New_York'
                },
                {
                    productId: testProduct.id,
                    dayOfWeek: [6], // Saturday
                    startTime: '10:00',
                    endTime: '16:00',
                    timezone: 'America/New_York'
                }
            ]
        });

        // Create product modifiers
        await testPrisma().productModifier.createMany({
            data: [
                {
                    productId: testProduct.id,
                    name: 'Extra Cheese',
                    priceDelta: 1.50
                },
                {
                    productId: testProduct.id,
                    name: 'Bacon',
                    priceDelta: 2.00
                }
            ]
        });
    });

    describe('GET /api/v1/stores/[id]/products/[productId]/availability - Check Product Availability', () => {
        it('should check product availability successfully', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            console.log('Product Availability Response:', JSON.stringify(response, null, 2));
            
            expect(response.success).toBe(true);
            expect(response.status).toBe(200);
            expect(response.data?.availability).toBeDefined();
            expect(response.data?.availability.productId).toBe(testProduct.id);
            expect(response.data?.availability.productName).toBe(testProduct.name);
            expect(response.data?.availability.storeId).toBe(testStore.id);
            expect(response.data?.availability.storeName).toBe(testStore.name);
            expect(response.data?.availability.storeTimezone).toBe('America/New_York');
            expect(response.data?.availability.isAvailable).toBeDefined();
            expect(response.data?.availability.checkedAt).toBeDefined();
            expect(response.data?.availability.checkedTime).toBeDefined();
        });

        it('should check availability for specific date', async () => {
            const specificDate = '2025-01-20'; // Monday
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability?date=${specificDate}`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.checkedAt).toContain(specificDate);
        });

        it('should check availability for specific time', async () => {
            const specificTime = '14:30';
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability?time=${specificTime}`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.checkedTime).toBe(specificTime);
        });

        it('should include pricing when requested', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability?includePricing=true`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.price).toBe(testProduct.price);
            expect(response.data?.availability.currency).toBe('USD');
        });

        it('should include modifiers when requested', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability?includeModifiers=true`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.modifiers).toBeDefined();
            expect(response.data?.availability.modifiers).toHaveLength(2);
            expect(response.data?.availability.modifiers[0].name).toBe('Extra Cheese');
            expect(response.data?.availability.modifiers[0].priceDelta).toBe(1.50);
        });

        it('should include next available time when product is not available', async () => {
            // Check availability for Sunday (when product is not available)
            const sundayDate = '2025-01-19'; // Sunday
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability?date=${sundayDate}&includeNextAvailable=true`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.isAvailable).toBe(false);
            expect(response.data?.availability.nextAvailableTime).toBeDefined();
        });

        it('should handle timezone differences correctly', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability`, {
                method: 'GET',
                headers: {
                    'x-user-timezone': 'Europe/London'
                }
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.timezoneInfo).toBeDefined();
            expect(response.data?.availability.timezoneInfo.userTimezone).toBe('Europe/London');
            expect(response.data?.availability.timezoneInfo.storeTimezone).toBe('America/New_York');
            expect(response.data?.availability.timezoneInfo.userCurrentTime).toBeDefined();
            expect(response.data?.availability.timezoneInfo.storeCurrentTime).toBeDefined();
        });

        it('should handle overnight availability windows', async () => {
            // Create a product with overnight availability
            const overnightProduct = await createTestProduct(testStore.id, {
                name: 'Overnight Product'
            });

            await testPrisma().productAvailability.create({
                data: {
                    productId: overnightProduct.id,
                    dayOfWeek: [1], // Monday
                    startTime: '22:00',
                    endTime: '02:00',
                    timezone: 'America/New_York'
                }
            });

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${overnightProduct.id}/availability`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: overnightProduct.id 
            });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability).toBeDefined();
        });

        it('should fail with invalid store ID', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/invalid-store-id/products/${testProduct.id}/availability`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: 'invalid-store-id', 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.code).toBe('PRODUCT_NOT_FOUND');
        });

        it('should fail with invalid product ID', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/invalid-product-id/availability`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: 'invalid-product-id' 
            });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.code).toBe('PRODUCT_NOT_FOUND');
        });

        it('should handle missing store ID parameter', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, {
                productId: testProduct.id,
                id: ''
            });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('MISSING_PARAMS');
        });

        it('should handle missing product ID parameter', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, {
                id: testStore.id,
                productId: ''
            });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('MISSING_PARAMS');
        });

        it('should handle invalid date parameter', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability?date=invalid-date`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('INVALID_QUERY');
        });

        it('should handle invalid time parameter', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability?time=25:00`, {
                method: 'GET',
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('INVALID_QUERY');
        });

        it('should handle timezone headers correctly', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability`, {
                method: 'GET',
                headers: {
                    'x-timezone': 'Asia/Tokyo'
                }
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.timezoneInfo).toBeDefined();
        });

        it('should handle multiple timezone header variations', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/stores/${testStore.id}/products/${testProduct.id}/availability`, {
                method: 'GET',
                headers: {
                    'timezone': 'Europe/Paris'
                }
            });

            const response = await ProductAvailabilityGetHandler(mockRequest, { 
                id: testStore.id, 
                productId: testProduct.id 
            });
            
            expect(response.success).toBe(true);
            expect(response.data?.availability.timezoneInfo).toBeDefined();
        });
    });
});
