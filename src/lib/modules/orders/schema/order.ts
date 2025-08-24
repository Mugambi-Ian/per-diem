import { z } from "zod";
import { DateTime } from "luxon";

// Order item schema
export const orderItemSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    modifiers: z.array(z.object({
        modifierId: z.string().min(1, "Modifier ID is required"),
        quantity: z.number().int().positive("Modifier quantity must be a positive integer")
    })).optional(),
    specialInstructions: z.string().max(500, "Special instructions too long").nullable().optional()
});

// Order creation schema
export const orderCreateSchema = z.object({
    storeId: z.string().min(1, "Store ID is required"),
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
    pickupTime: z.string().refine((time) => {
        // Validate ISO datetime string
        return DateTime.fromISO(time).isValid;
    }, "Invalid pickup time format"),
    specialInstructions: z.string().max(1000, "Special instructions too long").nullable().optional(),
    userTimezone: z.string().optional()
});

// Order update schema
export const orderUpdateSchema = z.object({
    status: z.enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]).optional(),
    pickupTime: z.string().refine((time) => {
        return DateTime.fromISO(time).isValid;
    }, "Invalid pickup time format").optional(),
    specialInstructions: z.string().max(1000, "Special instructions too long").nullable().optional(),
    items: z.array(orderItemSchema).optional()
});

// Order query schema
export const orderQuerySchema = z.object({
    page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).default(1),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).default(20),
    status: z.enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]).optional(),
    storeId: z.string().optional(),
    startDate: z.string().refine((date) => {
        return DateTime.fromISO(date).isValid;
    }, "Invalid start date format").optional(),
    endDate: z.string().refine((date) => {
        return DateTime.fromISO(date).isValid;
    }, "Invalid end date format").optional()
});

// Order response schema
export const orderResponseSchema = z.object({
    id: z.string(),
    userId: z.string(),
    storeId: z.string(),
    status: z.enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]),
    items: z.array(orderItemSchema),
    totalAmount: z.number().positive(),
    pickupTime: z.string(),
    specialInstructions: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    estimatedReadyTime: z.string().nullable().optional(),
    store: z.object({
        id: z.string(),
        name: z.string(),
        timezone: z.string()
    }).optional()
});
