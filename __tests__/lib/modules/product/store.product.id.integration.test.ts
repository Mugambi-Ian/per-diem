import {describe, it, expect, beforeEach} from "@jest/globals";
import {NextRequest} from "next/server";
import {testPrisma, createTestUser, createTestStore} from "@/__tests__/db.setup";
import {server_hash_password} from "@/lib/modules/auth/utils/password";
import {JWTPayload} from "jose";
import {
    StoreProductIdDeleteHandler,
    StoreProductIdGetHandler,
    StoreProductIdPutHandler
} from "@/lib/modules/product/stores.product.id.handler";

const password = "1Password-placeholder";

describe("StoreProductId Handlers Integration Tests", () => {
    let storeId: string;
    let productId: string;
    let jwt: JWTPayload;
    let userId: string;

    beforeEach(async () => {
        // Reset db
        await testPrisma().product.deleteMany();
        await testPrisma().store.deleteMany();
        await testPrisma().user.deleteMany();

        const user = await createTestUser({passwordHash: await server_hash_password(password)});
        userId = user.id;

        const store = await createTestStore(userId)
        storeId = store.id;

        const product = await testPrisma().product.create({
            data: {
                storeId,
                name: "Initial Product",
                price: 50,
            },
        });
        productId = product.id;

        jwt = {sub: userId};
    });

    describe("PUT /stores/:id/products/:productId", () => {
        it("should update product successfully", async () => {
            const body = {
                name: "Updated Product",
                price: 200,
                description: "Updated description",
                availability: [
                    {
                        dayOfWeek: [1],
                        startTime: "09:00",
                        endTime: "11:00",
                        timezone: "UTC",
                    },
                ],
                modifiers: [{name: "Extra topping", priceDelta: 10}],
            };

            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products/${productId}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            const res = await StoreProductIdPutHandler(req, {id: storeId, productId}, jwt);

            expect(res.success).toBe(true);
            expect(res.status).toBe(200);
            expect(res.data?.name).toBe("Updated Product");
            expect(res.data?.price).toBe(200);
            expect(res.data?.modifiers?.length).toBe(1);
        });

        it("should reject invalid body", async () => {
            const body = {price: -100}; // invalid
            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products/${productId}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            const res = await StoreProductIdPutHandler(req, {id: storeId, productId}, jwt);

            expect(res.success).toBe(false);
            expect(res.status).toBe(400);
            expect(res.error.code).toBe("INVALID_BODY");
        });

        it("should reject overlapping availability", async () => {
            const body = {
                name: "Overlap Product",
                price: 80,
                availability: [
                    {dayOfWeek: [1], startTime: "09:00", endTime: "12:00", timezone: "UTC"},
                    {dayOfWeek: [1], startTime: "11:00", endTime: "13:00", timezone: "UTC"},
                ],
            };

            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products/${productId}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            const res = await StoreProductIdPutHandler(req, {id: storeId, productId}, jwt);

            expect(res.success).toBe(false);
            expect(res.status).toBe(400);
            expect(res.error.error).toBe("Invalid availability");
            expect(res.error.details.overlaps.length).toBeGreaterThan(0);
        });

        it("should return 404 if product not found", async () => {
            const body = {name: "Ghost Product", price: 30};

            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products/nonexistent`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            const res = await StoreProductIdPutHandler(req, {id: storeId, productId: "nonexistent"}, jwt);

            expect(res.success).toBe(false);
            expect(res.status).toBe(404);
        });
    });

    describe("GET /stores/:id/products/:productId", () => {
        it("should return product if found", async () => {
            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products/${productId}`);

            const res = await StoreProductIdGetHandler(req, {id: storeId, productId});

            expect(res.success).toBe(true);
            expect(res.status).toBe(200);
            expect(res.data?.name).toBe("Initial Product");
        });

        it("should return 404 if product not found", async () => {
            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products/nonexistent`);

            const res = await StoreProductIdGetHandler(req, {id: storeId, productId: "nonexistent"});

            expect(res.success).toBe(false);
            expect(res.status).toBe(404);
            expect(res.error.code).toBe("NOT_FOUND");
        });
    });

    describe("DELETE /stores/:id/products/:productId", () => {
        it("should delete product successfully", async () => {
            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products/${productId}`, {
                method: "DELETE",
            });

            const res = await StoreProductIdDeleteHandler(req, {id: storeId, productId}, jwt);

            expect(res.success).toBe(true);
            expect(res.status).toBe(204);

            const check = await testPrisma().product.findUnique({where: {id: productId}});
            expect(check).toBeNull();
        });

        it("should return 404 if product not found", async () => {
            const req = new NextRequest(`http://localhost/api/v1/stores/${storeId}/products/nonexistent`, {
                method: "DELETE",
            });

            const res = await StoreProductIdDeleteHandler(req, {id: storeId, productId: "nonexistent"}, jwt);

            expect(res.success).toBe(false);
            expect(res.status).toBe(404);
        });
    });
});
