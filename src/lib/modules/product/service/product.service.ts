import {prisma} from "@/lib/db/prisma";
import {product_enrich} from "@/lib/modules/product/utils/enrich";
import {diff} from "@/shared/utils/object";
import {
    Product,
    productSchema,
    productUpdateSchema
} from "@/lib/modules/product/schema/product";

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
        id: `${index}`
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
                create: toAddAvail,
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

export const ProductService = {create, list, update, remove, get};
