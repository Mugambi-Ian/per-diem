import {describe, it, expect, beforeEach} from "@jest/globals";
import {NextRequest} from "next/server";
import {testPrisma, createTestUser, createTestStore} from "@/__tests__/db.setup";
import {server_hash_password} from "@/lib/modules/auth/utils/password";
import {JWTPayload} from "jose";
import {StoreProductGETHandler, StoreProductPostHandler} from "@/lib/modules/product/stores.products.handler";

const password = "1Password-placeholder";

describe("StoreProduct Handlers Integration Tests", () => {
    let storeId: string;
    let jwt: JWTPayload;
    let userId: string;

    beforeEach(async () => {
        // reset db
        await testPrisma().product.deleteMany();
        await testPrisma().store.deleteMany();
        await testPrisma().user.deleteMany();

        const user = await createTestUser({passwordHash: await server_hash_password(password)});
        userId = user.id;

        const store = await createTestStore(userId)
        storeId = store.id;

        jwt = {sub: userId}; // fake jwt with correct owner
    });

    describe("POST /stores/:id/products", () => {
        it("should create product successfully", async () => {
            const body = {
                name: "Test Product",
                price: 100,
                availability: [
                    {
                        dayOfWeek: [1, 2],
                        startTime: "09:00",
                        endTime: "11:00",
                        timezone: "UTC",
                    },
                ],
                modifiers: [{name: "Extra cheese", priceDelta: 5}],
            };

            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            const res = await StoreProductPostHandler(req, {id: storeId}, jwt);

            expect(res.success).toBe(true);
            expect(res.status).toBe(201);
            expect(res.data?.product).toBeDefined();
            expect(res.data?.product.name).toBe("Test Product");
            expect(res.data?.product.availability.length).toBe(1);
        });

        it("should reject invalid body", async () => {
            const body = {price: -50}; // missing name, invalid price
            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            const res = await StoreProductPostHandler(req, {id: storeId}, jwt);

            expect(res.success).toBe(false);
            expect(res.status).toBe(400);
            expect(res.error.code).toBe("INVALID_BODY");
        });

        it("should reject invalid availability overlaps", async () => {
            const body = {
                name: "Bad Product",
                price: 50,
                availability: [
                    {
                        dayOfWeek: [1],
                        startTime: "09:00",
                        endTime: "12:00",
                        timezone: "UTC",
                    },
                    {
                        dayOfWeek: [1],
                        startTime: "11:00",
                        endTime: "13:00",
                        timezone: "UTC",
                    },
                ],
            };

            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            const res = await StoreProductPostHandler(req, {id: storeId}, jwt);

            expect(res.success).toBe(false);
            expect(res.status).toBe(400);
            expect(res.error.error).toBe("Invalid availability");
            expect(res.error.details.overlaps.length).toBeGreaterThan(0);
        });

        it("should return 404 if store does not belong to user", async () => {
            // Fake jwt with another user
            const otherJwt = {sub: "different-user-id"};
            const body = {name: "Unauthorized Product", price: 20};

            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            const res = await StoreProductPostHandler(req, {id: storeId}, otherJwt);

            expect(res.success).toBe(false);
            expect(res.status).toBe(404);
            expect(res.error).toBe("Store not found");
        });
    });

    describe("GET /stores/:id/products", () => {
        it("should return paginated products", async () => {
            // Seed multiple products
            for (let i = 0; i < 5; i++) {
                await testPrisma().product.create({
                    data: {
                        storeId,
                        name: `Product ${i}`,
                        price: i * 10,
                    },
                });
            }

            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products?page=1&limit=2`);

            const res = await StoreProductGETHandler(req, {id: storeId});

            expect(res.success).toBe(true);
            expect(res.status).toBe(200);
            expect(res.data?.payload.length).toBe(2);
            expect(res.data?.meta.total).toBe(5);
            expect(res.data?.meta.totalPages).toBe(3);
        });
    });
});
