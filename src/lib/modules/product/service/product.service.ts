import {prisma} from "@/lib/db/prisma";
import {product_enrich} from "@/lib/modules/product/utils/enrich";
import {diff} from "@/shared/utils/object";
import {
    normalizeProductAvailability,
    Product,
    productSchema,
    productUpdateSchema
} from "@/lib/modules/product/schema/product";
import { DateTime } from "luxon";
import {getNextAvailableTime, isAvailableNow} from "@/lib/modules/product/utils/availability";

async function create(parsed: ReturnType<typeof productSchema.parse>, storeId: string) {
    const product: any = await prisma.product.create({
        data: {
            storeId,
            name: parsed.name,
            price: parsed.price,
            description: parsed.description,
            availability: {
                create: parsed.availability,
            },
            modifiers: {
                create: parsed.modifiers ?? [],
            },
        },
        include: {availability: true, modifiers: true},
    });

    return {status: 201, success: true, data: {product: product_enrich(product)}};
}

async function update(
    parsed: ReturnType<typeof productUpdateSchema.parse>,
    storeId?: string,
    productId?: string,
    userId?: string
) {
    const existing = await prisma.product.findFirst({
        where: {id: productId, storeId, store: {userId}},
        include: {availability: true, modifiers: true},
    });

    if (!existing) {
        return {success: false, status: 404, error: "Product not found in this store"};
    }

    // Diff availability using stored string times (not ISO conversion)
    const existingAvail = existing.availability.map((a: {
        id: any;
        dayOfWeek: any;
        startTime: any;
        endTime: any;
    }) => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime, // already stored as string
        endTime: a.endTime,
    }));

    const parsedAvail = (parsed.availability ?? []).map((a, index) => ({
        ...a,
        startTime: a.startTime,
        endTime: a.endTime,
        id: `temp-${index}`
    }));

    const {toDelete: toDeleteAvail, toAdd: toAddAvail} = diff(
        existingAvail,
        parsedAvail,
        (a, b) =>
            a.dayOfWeek === b.dayOfWeek &&
            a.startTime === b.startTime &&
            a.endTime === b.endTime
    );

    // Diff modifiers
    const existingMods = existing.modifiers.map((m: { id: any; name: any; priceDelta: any; }, index) => ({
        id:`${m.id}`,
        name: m.name,
        priceDelta: m.priceDelta,
    }));

    const {toDelete: toDeleteMods, toAdd: toAddMods} = diff(
        existingMods,
        (parsed.modifiers ?? []).map((m,i) => ({
            id: `${m.id}`,
            name: m.name,
            priceDelta: m.priceDelta,
        })),
        (a, b) => a.name === b.name && a.priceDelta === b.priceDelta
    );

    const updated: Product = await prisma.$transaction((tx: any) => tx.product.update({
        where: {id: productId},
        data: {
            name: parsed.name,
            description: parsed.description,
            price: parsed.price,
            lastModified: new Date(),
            availability: {
                deleteMany: {id: {in: toDeleteAvail.map((a) => a.id)}},
                create: toAddAvail.map(({id, ...rest}) => rest),
            },
            modifiers: {
                deleteMany: {id: {in: toDeleteMods.map((m) => m.id)}},
                create: toAddMods,
            },
        },
        include: {availability: true, modifiers: true},
    }));
    return {success: true, status: 200, data: product_enrich(updated)};
}

async function remove(storeId?: string, productId?: string, userId?: string) {
    const existing = await prisma.product.findFirst({
        where: {id: productId, storeId, store: {userId}},
    });

    if (!existing) {
        return {success: false, status: 404, error: "Product not found in this store"};
    }

    await prisma.product.delete({where: {id: productId}});
    return {success: true, status: 204, data: null};
}

async function get(storeId?: string, productId?: string) {
    const product = await prisma.product.findFirst({
        where: {id: productId, storeId},
        include: {
            availability: true,
            modifiers: true,
        },
    });

    if (!product) {
        return {
            status: 404,
            success: false,
            error: {code: "NOT_FOUND", message: "Product not found"},
        };
    }

    return {
        status: 200,
        success: true,
        data: product_enrich(product),
    };
}

async function list(page: number, limit: number, storeId?: string) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where: {storeId},
            skip,
            take: limit,
            include: {availability: true, modifiers: true},
        }),
        prisma.product.count({where: {storeId}}),
    ]);

    return {
        status: 200,
        success: true,
        data: {
            payload: products.map(p=>product_enrich(p)),
            meta: {
                page,
                limit,
                total,
                totalPages: limit > 0 ? Math.ceil(total / limit) : 1, // ✅ guard against 0
            },
        },
    };
}

async function getAvailability(productId: string, storeId: string, queryData: any) {
    try {
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId },
            include: {
                availability: true,
                modifiers: true,
                store: {
                    select: {
                        id: true,
                        name: true,
                        timezone: true
                    }
                }
            }
        });

        if (!product) {
            return {
                success: false,
                error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" },
                status: 404,
            };
        }

        const { date, time, includeModifiers, includePricing, includeNextAvailable } = queryData;
        const userTimezone = queryData.userTimezone;

        // Use provided date/time or current time
        const checkDate = date ? DateTime.fromISO(date) : DateTime.now();
        const checkTime = time || checkDate.toFormat("HH:mm");

        // @ts-expect-error Normalize availability data
        const availability = product.availability.map(a => normalizeProductAvailability(a)[0]);
        // Check if product is available at the specified time
        const isAvailable = isAvailableNow(availability, checkDate);

        const result: any = {
            productId: product.id,
            productName: product.name,
            storeId: product.storeId,
            storeName: product.store.name,
            storeTimezone: product.store.timezone,
            isAvailable,
            checkedAt: checkDate.toISO(),
            checkedTime: checkTime
        };

        if (includePricing) {
            result.price = product.price;
            result.currency = "USD"; // Assuming USD for now
        }

        if (includeModifiers && product.modifiers.length > 0) {
            result.modifiers = product.modifiers.map(mod => ({
                id: mod.id,
                name: mod.name,
                priceDelta: mod.priceDelta
            }));
        }

        if (includeNextAvailable && !isAvailable) {
            result.nextAvailableTime = getNextAvailableTime(availability, checkDate);
        }

        if (userTimezone && userTimezone !== product.store.timezone) {
            result.timezoneInfo = {
                userTimezone,
                storeTimezone: product.store.timezone,
                userCurrentTime: DateTime.now().setZone(userTimezone).toFormat("HH:mm"),
                storeCurrentTime: DateTime.now().setZone(product.store.timezone).toFormat("HH:mm")
            };
        }

        return {
            success: true,
            data: { availability: result },
            status: 200,
        };
    } catch (error: any) {
        return {
            success: false,
            error: { code: "AVAILABILITY_CHECK_FAILED", message: error.message },
            status: 500,
        };
    }
}

export const ProductService = {create, list, update, remove, get, getAvailability};
