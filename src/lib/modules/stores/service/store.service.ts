import {prisma} from "@/lib/db/prisma";
import {storeSchema, storeUpdateSchema, storeQuery} from "@/lib/modules/stores/schema/store";
import {DateTime} from "luxon";
import {store_enrich} from "@/lib/modules/stores/utils/enrich";
import {isStoreOpen} from "@/lib/modules/stores/utils/availability";

async function create(
    parsedData: ReturnType<typeof storeSchema.parse>,
    userId: string
) {
    const created =await prisma.store.create({
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
    return  {success: true, data: created, status: 201}
}

async function get(id: string, userTimezone?: string) {
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
    const result = {
        ...store,
        currentLocalTime: now.toISO(),
        isCurrentlyOpen: store.operatingHours.some((h: { isOpen: any; }) => h.isOpen),
    };
    
    // Enrich with user timezone if provided
    if (userTimezone) {
        return {success: true, data: store_enrich(result, undefined, undefined, userTimezone)};
    }
    
    return {success: true, data: result};
}

async function update(id: string, userId: string, data: any) {
    // Ownership check
    const existing = await prisma.store.findFirst({where: {id, userId}});
    if (!existing) return {error: "Store not found or not owned"};

   if(data.slug){
       // Slug uniqueness
       const slugConflict = await prisma.store.findFirst({
           where: {slug: data.slug, NOT: {id}},
       });
       if (slugConflict) return {error: "Slug already in use"};
   }

    const updated = await prisma.$transaction(async (tx: {
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
                    create: data.operatingHours?.map((h: any) => ({
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
    return {success: true, data: updated}
}

async function remove(id: string, userId: string) {
    const existing = await prisma.store.findFirst({where: {id, userId}});
    if (!existing) return {error: "Store not found or not owned"};

    await prisma.$transaction(async (tx: { store: { delete: (arg0: { where: { id: string; }; }) => any; }; }) => {
        await tx.store.delete({where: {id}});
    });

    const deleted = {message: "Store deleted successfully"};
    return {success: true, data: deleted}
}

async function list(params: ReturnType<typeof storeQuery.parse> & { userTimezone?: string }) {
    const {q, page, limit, sort, lat, lng, userTimezone} = params;

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

    if (lat!==undefined && lng!==undefined) {
        const allStores = await prisma.store.findMany({
            where,
            include: {operatingHours: true}
        });

        total = allStores.length;

        const enriched = allStores.map((s: any) => store_enrich(s, lat, lng, userTimezone));
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
        stores = pagedStores.map((s: any) => store_enrich(s, lat, lng, userTimezone));
    }

    const list = {
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            userTimezone: userTimezone || null, // Include user timezone in response
        },
        payload: stores,
    };
    return {
        success: true,
        data: list,
    };
}

async function checkStoreOwnership(storeId?: string, userId?: string) {
    if (!storeId || !userId) return null;
    return prisma.store.findFirst({where: {id: storeId, userId}});
}

async function getAvailability(storeId: string, queryData: any) {
    try {
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            include: { operatingHours: true }
        });

        if (!store) {
            return {
                success: false,
                error: { code: "STORE_NOT_FOUND", message: "Store not found" },
                status: 404,
            };
        }

        const { date, time, includeNextOpen, includeDSTInfo } = queryData;
        const userTimezone = queryData.userTimezone;

        // Use provided date/time or current time
        const checkDate = date ? DateTime.fromISO(date) : DateTime.now();
        const checkTime = time || checkDate.toFormat("HH:mm");

        // Get store availability
        const availability = isStoreOpen(store, checkDate, userTimezone);

        const result: any = {
            storeId: store.id,
            storeName: store.name,
            timezone: store.timezone,
            currentLocalTime: DateTime.now().setZone(store.timezone).toFormat("HH:mm"),
            isCurrentlyOpen: availability.isOpen,
            checkedAt: checkDate.toISO(),
            checkedTime: checkTime
        };

        if (includeNextOpen && !availability.isOpen) {
            result.nextOpenTime = availability.nextOpen;
        }

        if (includeDSTInfo && userTimezone && userTimezone !== store.timezone) {
            result.timezoneInfo = {
                userTimezone,
                storeTimezone: store.timezone,
                userCurrentTime: DateTime.now().setZone(userTimezone).toFormat("HH:mm"),
                storeCurrentTime: DateTime.now().setZone(store.timezone).toFormat("HH:mm")
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

export const StoreService = {
    create,
    update,
    remove,
    get,
    list,
    checkStoreOwnership,
    getAvailability
}