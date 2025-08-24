import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { OrderIdGetHandler, OrderIdPutHandler, OrderIdDeleteHandler } from '@/lib/modules/orders/order.id.handler';
import { createTestUser, createTestStore, createTestProduct, testPrisma } from "@/__tests__/db.setup";
import { server_hash_password } from "@/lib/modules/auth/utils/password";

const password = '1Password-placeholder';

describe('Order ID Handler Integration Tests', () => {
    let mockRequest: NextRequest;
    let testUser: any;
    let testStore: any;
    let testProduct: any;
    let testOrder: any;

    beforeEach(async () => {
        // Create test data
        testUser = await createTestUser({ passwordHash: await server_hash_password(password) });
        testStore = await createTestStore(testUser.id);
        testProduct = await createTestProduct(testStore.id);
        
        // Create a test order
        testOrder = await testPrisma().order.create({
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
            },
            include: {
                items: {
                    include: {
                        product: true,
                        modifiers: true
                    }
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        timezone: true
                    }
                }
            }
        });
    });

    describe('GET /api/v1/orders/[id] - Get Order', () => {
        it('should get order details successfully', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'GET',
            });

            const response = await OrderIdGetHandler(mockRequest, { id: testOrder.id }, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.status).toBe(200);
            expect(response.data?.order).toBeDefined();
            expect(response.data?.order.id).toBe(testOrder.id);
            expect(response.data?.order.userId).toBe(testUser.id);
            expect(response.data?.order.storeId).toBe(testStore.id);
            expect(response.data?.order.status).toBe('pending');
            expect(response.data?.order.items).toHaveLength(1);
        });

        it('should fail when order does not exist', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders/non-existent-id', {
                method: 'GET',
            });

            const response = await OrderIdGetHandler(mockRequest, { id: 'non-existent-id' }, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.code).toBe('ORDER_NOT_FOUND');
        });

        it('should fail when user does not own the order', async () => {
            const otherUser = await createTestUser({ 
                email: 'other@example.com',
                passwordHash: await server_hash_password(password)
            });

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'GET',
            });

            const response = await OrderIdGetHandler(mockRequest, { id: testOrder.id }, { sub: otherUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.code).toBe('ORDER_NOT_FOUND');
        });

        it('should fail without authentication', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'GET',
            });

            const response = await OrderIdGetHandler(mockRequest, { id: testOrder.id }, undefined);
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(401);
            expect(response.error.code).toBe('UNAUTHORIZED');
        });
    });

    describe('PUT /api/v1/orders/[id] - Update Order', () => {
        it('should update order status successfully', async () => {
            const updateData = {
                status: 'confirmed'
            };

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const response = await OrderIdPutHandler(mockRequest, { id: testOrder.id }, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.status).toBe(200);
            expect(response.data?.order.status).toBe('confirmed');

            // Verify database was updated
            const updatedOrder = await testPrisma().order.findUnique({ where: { id: testOrder.id } });
            expect(updatedOrder?.status).toBe('confirmed');
        });

        it('should update pickup time successfully', async () => {
            const newPickupTime = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
            const updateData = {
                pickupTime: newPickupTime
            };

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const response = await OrderIdPutHandler(mockRequest, { id: testOrder.id }, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.order.pickupTime).toBe(newPickupTime);
        });

        it('should update special instructions successfully', async () => {
            const updateData = {
                specialInstructions: 'Updated special instructions'
            };

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const response = await OrderIdPutHandler(mockRequest, { id: testOrder.id }, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.data?.order.specialInstructions).toBe('Updated special instructions');
        });

        it('should fail when updating completed order', async () => {
            // First complete the order
            await testPrisma().order.update({
                where: { id: testOrder.id },
                data: { status: 'completed' }
            });

            const updateData = {
                status: 'confirmed'
            };

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const response = await OrderIdPutHandler(mockRequest, { id: testOrder.id }, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('ORDER_UPDATE_NOT_ALLOWED');
        });

        it('should fail when updating cancelled order', async () => {
            // First cancel the order
            await testPrisma().order.update({
                where: { id: testOrder.id },
                data: { status: 'cancelled' }
            });

            const updateData = {
                status: 'confirmed'
            };

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const response = await OrderIdPutHandler(mockRequest, { id: testOrder.id }, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('ORDER_UPDATE_NOT_ALLOWED');
        });

        it('should fail when order does not exist', async () => {
            const updateData = {
                status: 'confirmed'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders/non-existent-id', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const response = await OrderIdPutHandler(mockRequest, { id: 'non-existent-id' }, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.code).toBe('ORDER_NOT_FOUND');
        });

        it('should fail without authentication', async () => {
            const updateData = {
                status: 'confirmed'
            };

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const response = await OrderIdPutHandler(mockRequest, { id: testOrder.id }, undefined);
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(401);
            expect(response.error.code).toBe('UNAUTHORIZED');
        });
    });

    describe('DELETE /api/v1/orders/[id] - Delete Order', () => {
        it('should delete pending order successfully', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'DELETE',
            });

            const response = await OrderIdDeleteHandler(mockRequest, { id: testOrder.id }, { sub: testUser.id });
            
            expect(response.success).toBe(true);
            expect(response.status).toBe(200);
            expect(response.data?.success).toBe(true);

            // Verify order was deleted
            const deletedOrder = await testPrisma().order.findUnique({ where: { id: testOrder.id } });
            expect(deletedOrder).toBeNull();
        });

        it('should fail when deleting completed order', async () => {
            // First complete the order
            await testPrisma().order.update({
                where: { id: testOrder.id },
                data: { status: 'completed' }
            });

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'DELETE',
            });

            const response = await OrderIdDeleteHandler(mockRequest, { id: testOrder.id }, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('ORDER_DELETION_NOT_ALLOWED');
        });

        it('should fail when deleting cancelled order', async () => {
            // First cancel the order
            await testPrisma().order.update({
                where: { id: testOrder.id },
                data: { status: 'cancelled' }
            });

            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'DELETE',
            });

            const response = await OrderIdDeleteHandler(mockRequest, { id: testOrder.id }, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(400);
            expect(response.error.code).toBe('ORDER_DELETION_NOT_ALLOWED');
        });

        it('should fail when order does not exist', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/orders/non-existent-id', {
                method: 'DELETE',
            });

            const response = await OrderIdDeleteHandler(mockRequest, { id: 'non-existent-id' }, { sub: testUser.id });
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(404);
            expect(response.error.code).toBe('ORDER_NOT_FOUND');
        });

        it('should fail without authentication', async () => {
            mockRequest = new NextRequest(`http://localhost:3000/api/v1/orders/${testOrder.id}`, {
                method: 'DELETE',
            });

            const response = await OrderIdDeleteHandler(mockRequest, { id: testOrder.id }, undefined);
            
            expect(response.success).toBe(false);
            expect(response.status).toBe(401);
            expect(response.error.code).toBe('UNAUTHORIZED');
        });
    });
});
