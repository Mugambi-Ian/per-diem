import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/lib/utils/response";
import { orderResponseSchema } from "@/lib/modules/orders/schema/order";

export class OrdersService {
    static async create(orderData: any, userId: string): Promise<ApiResponse<{ order?: any }>> {
        try {
            // Validate store exists and is open
            const store = await prisma.store.findUnique({
                where: { id: orderData.storeId },
                include: { operatingHours: true }
            });

            if (!store) {
                return {
                    success: false,
                    error: { code: "STORE_NOT_FOUND", message: "Store not found" },
                    status: 404,
                };
            }

            // Calculate total amount
            let totalAmount = 0;
            for (const item of orderData.items) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    include: { modifiers: true }
                });

                if (!product) {
                    return {
                        success: false,
                        error: { code: "PRODUCT_NOT_FOUND", message: `Product ${item.productId} not found` },
                        status: 404,
                    };
                }

                let itemTotal = product.price * item.quantity;
                
                // Add modifier costs
                if (item.modifiers) {
                    for (const mod of item.modifiers) {
                        const modifier = product.modifiers.find(m => m.id === mod.modifierId);
                        if (modifier) {
                            itemTotal += modifier.priceDelta * mod.quantity;
                        }
                    }
                }
                
                totalAmount += itemTotal;
            }

            // Create order
            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId: orderData.storeId,
                    status: "pending",
                    totalAmount,
                    pickupTime: new Date(orderData.pickupTime),
                    specialInstructions: orderData.specialInstructions,
                    items: {
                        create: orderData.items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            specialInstructions: item.specialInstructions,
                            modifiers: item.modifiers ? {
                                create: item.modifiers.map((mod: any) => ({
                                    modifierId: mod.modifierId,
                                    quantity: mod.quantity
                                }))
                            } : undefined
                        }))
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

            // Transform the order data to match the schema
            const transformedOrder = {
                id: order.id,
                userId: order.userId,
                storeId: order.storeId,
                status: order.status,
                totalAmount: order.totalAmount,
                pickupTime: order.pickupTime.toISOString(),
                specialInstructions: order.specialInstructions,
                estimatedReadyTime: order.estimatedReadyTime?.toISOString(),
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString(),
                items: order.items.map((item: any) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    specialInstructions: item.specialInstructions,
                    modifiers: item.modifiers?.map((mod: any) => ({
                        modifierId: mod.modifierId,
                        quantity: mod.quantity
                    })) || []
                })),
                store: order.store
            };

            return {
                success: true,
                data: { order: orderResponseSchema.parse(transformedOrder) },
                status: 201,
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: "ORDER_CREATION_FAILED", message: error.message },
                status: 500,
            };
        }
    }

    static async get(orderId: string, userId: string): Promise<ApiResponse<{ order?: any }>> {
        try {
            const order = await prisma.order.findFirst({
                where: { id: orderId, userId },
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

            if (!order) {
                return {
                    success: false,
                    error: { code: "ORDER_NOT_FOUND", message: "Order not found" },
                    status: 404,
                };
            }

            // Transform the order data to match the schema
            const transformedOrder = {
                id: order.id,
                userId: order.userId,
                storeId: order.storeId,
                status: order.status,
                totalAmount: order.totalAmount,
                pickupTime: order.pickupTime.toISOString(),
                specialInstructions: order.specialInstructions,
                estimatedReadyTime: order.estimatedReadyTime?.toISOString(),
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString(),
                items: order.items.map((item: any) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    specialInstructions: item.specialInstructions,
                    modifiers: item.modifiers?.map((mod: any) => ({
                        modifierId: mod.modifierId,
                        quantity: mod.quantity
                    })) || []
                })),
                store: order.store
            };

            return {
                success: true,
                data: { order: orderResponseSchema.parse(transformedOrder) },
                status: 200,
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: "ORDER_FETCH_FAILED", message: error.message },
                status: 500,
            };
        }
    }

    static async list(queryData: any, userId: string): Promise<ApiResponse<{ orders?: any[], meta?: any }>> {
        try {
            const { page, limit, status, storeId, startDate, endDate } = queryData;
            const skip = (page - 1) * limit;

            const where: any = { userId };
            if (status) where.status = status;
            if (storeId) where.storeId = storeId;
            if (startDate || endDate) {
                where.pickupTime = {};
                if (startDate) where.pickupTime.gte = new Date(startDate);
                if (endDate) where.pickupTime.lte = new Date(endDate);
            }

            const [orders, total] = await Promise.all([
                prisma.order.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        store: {
                            select: {
                                id: true,
                                name: true,
                                timezone: true
                            }
                        }
                    }
                }),
                prisma.order.count({ where })
            ]);

            const totalPages = Math.ceil(total / limit);

            // Transform orders to match schema
            const transformedOrders = orders.map(order => ({
                id: order.id,
                userId: order.userId,
                storeId: order.storeId,
                status: order.status,
                totalAmount: order.totalAmount,
                pickupTime: order.pickupTime.toISOString(),
                specialInstructions: order.specialInstructions,
                estimatedReadyTime: order.estimatedReadyTime?.toISOString(),
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString(),
                items: [], // We don't include items in list view for performance
                store: order.store
            }));

            return {
                success: true,
                data: {
                    orders: transformedOrders.map(order => orderResponseSchema.parse(order)),
                    meta: {
                        totalPages,
                        total,
                        page,
                        limit
                    }
                },
                status: 200,
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: "ORDERS_FETCH_FAILED", message: error.message },
                status: 500,
            };
        }
    }

    static async update(orderId: string, updateData: any, userId: string): Promise<ApiResponse<{ order?: any }>> {
        try {
            const order = await prisma.order.findFirst({
                where: { id: orderId, userId }
            });

            if (!order) {
                return {
                    success: false,
                    error: { code: "ORDER_NOT_FOUND", message: "Order not found" },
                    status: 404,
                };
            }

            // Only allow updates for certain statuses
            if (order.status === "completed" || order.status === "cancelled") {
                return {
                    success: false,
                    error: { code: "ORDER_UPDATE_NOT_ALLOWED", message: "Cannot update completed or cancelled orders" },
                    status: 400,
                };
            }

            // Transform update data
            const transformedUpdateData: any = {};
            if (updateData.status) transformedUpdateData.status = updateData.status;
            if (updateData.pickupTime) transformedUpdateData.pickupTime = new Date(updateData.pickupTime);
            if (updateData.specialInstructions) transformedUpdateData.specialInstructions = updateData.specialInstructions;

            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: transformedUpdateData,
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

            // Transform the updated order data to match the schema
            const transformedOrder = {
                id: updatedOrder.id,
                userId: updatedOrder.userId,
                storeId: updatedOrder.storeId,
                status: updatedOrder.status,
                totalAmount: updatedOrder.totalAmount,
                pickupTime: updatedOrder.pickupTime.toISOString(),
                specialInstructions: updatedOrder.specialInstructions,
                estimatedReadyTime: updatedOrder.estimatedReadyTime?.toISOString(),
                createdAt: updatedOrder.createdAt.toISOString(),
                updatedAt: updatedOrder.updatedAt.toISOString(),
                items: updatedOrder.items.map((item: any) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    specialInstructions: item.specialInstructions,
                    modifiers: item.modifiers?.map((mod: any) => ({
                        modifierId: mod.modifierId,
                        quantity: mod.quantity
                    })) || []
                })),
                store: updatedOrder.store
            };

            return {
                success: true,
                data: { order: orderResponseSchema.parse(transformedOrder) },
                status: 200,
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: "ORDER_UPDATE_FAILED", message: error.message },
                status: 500,
            };
        }
    }

    static async delete(orderId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const order = await prisma.order.findFirst({
                where: { id: orderId, userId }
            });

            if (!order) {
                return {
                    success: false,
                    error: { code: "ORDER_NOT_FOUND", message: "Order not found" },
                    status: 404,
                };
            }

            // Only allow deletion for pending orders
            if (order.status !== "pending") {
                return {
                    success: false,
                    error: { code: "ORDER_DELETION_NOT_ALLOWED", message: "Can only delete pending orders" },
                    status: 400,
                };
            }

            await prisma.order.delete({
                where: { id: orderId }
            });

            return {
                success: true,
                data: { success: true },
                status: 200,
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: "ORDER_DELETION_FAILED", message: error.message },
                status: 500,
            };
        }
    }
}
