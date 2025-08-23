import {prisma} from "@/lib/db/prisma";
import {server_store_enrich} from "@/lib/modules/stores/utils/enrich";
import {storeQuery, storeSchema} from "@/lib/modules/stores/schema/store";
import {DateTime} from "luxon";

async function create(
    parsedData: ReturnType<typeof storeSchema.parse>,
    userId?: string
) {
    return await prisma.store.create({
        data: {
            name: parsedData.name,
            slug: parsedData.slug,
            address: parsedData.address,
            timezone: parsedData.timezone,
            lat: parsedData.lat,
            lng: parsedData.lng,
            userId,
            operatingHours: {
                create: parsedData.operatingHours.map((h) => ({
                    dayOfWeek: h.dayOfWeek,
                    openTime: h.openTime,
                    closeTime: h.closeTime,
                    isOpen: h.isOpen,
                    closesNextDay: h.closesNextDay,
                    dstAware: h.dstAware,
                })),
            },
        },
        include: {operatingHours: true},
    });
}

async function get(id: string) {
    const store = await prisma.store.findUnique({
        where: {id},
        include: {
            operatingHours: true,
            products: true,
            user: true,
        },
    });
    if (!store) return null;

    const now = DateTime.utc().setZone(store.timezone);
    return {
        ...store,
        currentLocalTime: now.toISO(),
        isCurrentlyOpen: store.operatingHours.some((h: { isOpen: any; }) => h.isOpen),
    };
}

async function update(id: string, userId: string, data: any) {
    // Ownership check
    const existing = await prisma.store.findFirst({where: {id, userId}});
    if (!existing) return {error: "Store not found or not owned"};

    // Slug uniqueness
    const slugConflict = await prisma.store.findFirst({
        where: {slug: data.slug, NOT: {id}},
    });
    if (slugConflict) return {error: "Slug already in use"};

    return await prisma.$transaction(async (tx: {
        store: {
            update: (arg0: { where: { id: string; }; data: any; include: { operatingHours: boolean; }; }) => any;
        };
    }) => {
        return tx.store.update({
            where: {id},
            data: {
                ...data,
                updatedAt: new Date(),
                operatingHours: {
                    deleteMany: {},
                    create: data.operatingHours.map((h: any) => ({
                        dayOfWeek: h.dayOfWeek,
                        openTime: h.openTime,
                        closeTime: h.closeTime,
                        isOpen: h.isOpen,
                        closesNextDay: h.closesNextDay,
                        dstAware: h.dstAware,
                    })),
                },
            },
            include: {operatingHours: true},
        });
    });
}

async function remove(id: string, userId: string) {
    const existing = await prisma.store.findFirst({where: {id, userId}});
    if (!existing) return {error: "Store not found or not owned"};

    await prisma.$transaction(async (tx: { store: { delete: (arg0: { where: { id: string; }; }) => any; }; }) => {
        await tx.store.delete({where: {id}});
    });

    return {message: "Store deleted successfully"};
}

async function list(params: ReturnType<typeof storeQuery.parse>) {
    const {q, page, limit, sort, lat, lng} = params;

    const where: any = {};
    if (q) {
        where.OR = [
            {name: {contains: q, mode: "insensitive"}},
            {slug: {contains: q, mode: "insensitive"}},
            {address: {contains: q, mode: "insensitive"}},
        ];
    }

    const pageNum = Math.max(1, page ?? 1);
    const limitNum = Math.min(100, limit ?? 10);

    let stores: any[] = [];
    let total = 0;

    if (sort === "distance" && lat && lng) {
        const allStores = await prisma.store.findMany({
            where,
            include: {operatingHours: true}
        });

        total = allStores.length;

        const enriched = allStores.map((s: any) => server_store_enrich(s, lat, lng));
        const sorted = enriched.sort(
            (a: { distanceKm: any; }, b: {
                distanceKm: any;
            }) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
        );

        stores = sorted.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    } else {
        const [pagedStores, count] = await Promise.all([
            prisma.store.findMany({
                where,
                orderBy:
                    sort === "name"
                        ? {name: "asc"}
                        : sort === "createdAt"
                            ? {createdAt: "desc"}
                            : undefined,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {operatingHours: true}
            }),
            prisma.store.count({where}),
        ]);

        total = count;
        stores = pagedStores.map((s: any) => server_store_enrich(s, lat, lng));
    }

    return {
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
        payload: stores,
    };
}

async function checkStoreOwnership(storeId?: string, userId?: string) {
    if (!storeId || !userId) return null;
    return prisma.store.findFirst({ where: { id: storeId, userId } });
}

export const StoreService = {
    create,
    update,
    remove,
    get,
    list,
    checkStoreOwnership
}