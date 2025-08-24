import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { OrdersGetHandler, OrdersPostHandler } from '@/lib/modules/orders/orders.handler';
import { createTestUser, createTestStore, createTestProduct, testPrisma } from "@/__tests__/db.setup";
import { server_hash_password } from "@/lib/modules/auth/utils/password";

const password = '1Password-placeholder';

describe('Orders Handler Integration Tests', () => {
    let mockRequest: NextRequest;
    let testUser: any;
    let testStore: any;
    let testProduct: any;

    beforeEach(async () => {
        // Create test data
        testUser = await createTestUser({ passwordHash: await server_hash_password(password) });
        testStore = await createTestStore(testUser.id);
        testProduct = await createTestProduct(testStore.id);
    });

    describe('POST /api/v1/orders - Create Order', () => {
        it('should create a new order successfully', async () => {
            const orderData = {
                storeId: testStore.id,
                items: [
                    {
                        productId: testProduct.id,
                        quantity: 2,
                        specialInstructions: 'Extra crispy please'
                    }
                ],
                pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
                specialInstructions: 'Please have ready on time'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const response = await OrdersPostHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.status).toBe(201);
            expect(response.data?.order).toBeDefined();
            expect(response.data?.order.storeId).toBe(testStore.id);
            expect(response.data?.order.userId).toBe(testUser.id);
            expect(response.data?.order.status).toBe('pending');
            expect(response.data?.order.totalAmount).toBe(testProduct.price * 2);
            expect(response.data?.order.items).toHaveLength(1);
        });

        it('should create order with modifiers', async () => {
            // Create a product modifier
            const modifier = await testPrisma().productModifier.create({
                data: {
                    productId: testProduct.id,
                    name: 'Extra Cheese',
                    priceDelta: 1.50
                }
            });

            const orderData = {
                storeId: testStore.id,
                items: [
                    {
                        productId: testProduct.id,
                        quantity: 1,
                        modifiers: [
                            {
                                modifierId: modifier.id,
                                quantity: 2
                            }
                        ]
                    }
                ],
                pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const response = await OrdersPostHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.order.totalAmount).toBe(testProduct.price + (modifier.priceDelta * 2));
        });

        it('should fail with invalid store ID', async () => {
            const orderData = {
                storeId: 'invalid-store-id',
                items: [
                    {
                        productId: testProduct.id,
                        quantity: 1
                    }
                ],
                pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const response = await OrdersPostHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.code).toBe('STORE_NOT_FOUND');
        });

        it('should fail with invalid product ID', async () => {
            const orderData = {
                storeId: testStore.id,
                items: [
                    {
                        productId: 'invalid-product-id',
                        quantity: 1
                    }
                ],
                pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const response = await OrdersPostHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.code).toBe('PRODUCT_NOT_FOUND');
        });

        it('should fail without authentication', async () => {
            const orderData = {
                storeId: testStore.id,
                items: [
                    {
                        productId: testProduct.id,
                        quantity: 1
                    }
                ],
                pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const response = await OrdersPostHandler(mockRequest, {}, undefined);
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(401);
            expect(response.error.code).toBe('UNAUTHORIZED');
        });
    });

    describe('GET /api/v1/orders - List Orders', () => {
        beforeEach(async () => {
            // Create some test orders
            await testPrisma().order.create({
                data: {
                    userId: testUser.id,
                    storeId: testStore.id,
                    status: 'pending',
                    totalAmount: 19.98,
                    pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
                    items: {
                        create: [
                            {
                                productId: testProduct.id,
                                quantity: 2
                            }
                        ]
                    }
                }
            });

            await testPrisma().order.create({
                data: {
                    userId: testUser.id,
                    storeId: testStore.id,
                    status: 'completed',
                    totalAmount: 9.99,
                    pickupTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    items: {
                        create: [
                            {
                                productId: testProduct.id,
                                quantity: 1
                            }
                        ]
                    }
                }
            });
        });

        it('should list user orders successfully', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders?page=1&limit=10', {
                method: 'GET',
            });

            const response = await OrdersGetHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.status).toBe(200);
            expect(response.data?.orders).toBeDefined();
            expect(response.data?.orders).toHaveLength(2);
            expect(response.data?.meta).toBeDefined();
            expect(response.data?.meta.total).toBe(2);
        });

        it('should filter orders by status', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders?status=pending', {
                method: 'GET',
            });

            const response = await OrdersGetHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.orders).toHaveLength(1);
            expect(response.data?.orders[0].status).toBe('pending');
        });

        it('should filter orders by store', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders?storeId=${testStore.id}`, {
                method: 'GET',
            });

            const response = await OrdersGetHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.orders).toHaveLength(2);
            expect(response.data?.orders.every(order => order.storeId === testStore.id)).toBe(true);
        });

        it('should paginate results correctly', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders?page=1&limit=1', {
                method: 'GET',
            });

            const response = await OrdersGetHandler(mockRequest, {}, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.orders).toHaveLength(1);
            expect(response.data?.meta.page).toBe(1);
            expect(response.data?.meta.limit).toBe(1);
            expect(response.data?.meta.totalPages).toBe(2);
        });

        it('should fail without authentication', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders', {
                method: 'GET',
            });

            const response = await OrdersGetHandler(mockRequest, {}, undefined);
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(401);
            expect(response.error.code).toBe('UNAUTHORIZED');
        });
    });
});
