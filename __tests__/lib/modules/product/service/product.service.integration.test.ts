// __tests__/product.integration.test.ts
import {describe, it, expect, beforeEach} from "@jest/globals";
import {createTestStore, createTestUser, testPrisma} from "@/__tests__/db.setup"; // assumes same test DB setup helper
import {ProductUpdateInput} from "@/lib/modules/product/schema/product";
import {ProductService} from "@/lib/modules/product/service/product.service";
import {DateTime} from "luxon";
import {object_stringify} from "@/shared/utils/object";

describe("ProductService Integration Tests", () => {
    let storeId: string;
    let userId: string;

    beforeEach(async () => {
        // Reset database state before each test
        await testPrisma().product.deleteMany();
        await testPrisma().store.deleteMany();
        await testPrisma().user.deleteMany();

        // Create a test user + store
        const user = await createTestUser();
        userId = user.id;

        const store = await createTestStore(userId);
        storeId = store.id;
    });

    describe("Create", () => {
        it("should create a product successfully", async () => {
            const productInput = {
                name: "Test Product",
                description: "Test Description",
                price: 19.99,
                availability: [
                    {dayOfWeek: [1, 2], startTime: "09:00", endTime: "17:00", timezone: DateTime.now().zoneName},
                ],
                modifiers: [{name: "Extra Cheese", priceDelta: 2.0}],
            };

            const result = await ProductService.create(productInput, storeId);
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
            expect(result.data.product.name).toBe("Test Product");
            expect(result.data.product.availability.length).toBe(1);
            expect(result.data.product.modifiers.length).toBe(1);
        });
    });

    describe("Get", () => {
        it("should return a product if it exists", async () => {
            const created = await ProductService.create(
                {
                    name: "Get Product",
                    description: "desc",
                    price: 9.99,
                    availability: [],
                    modifiers: [],
                },
                storeId
            );

            const result = await ProductService.get(storeId, created.data.product.id);
            expect(result.success).toBe(true);
            expect(result.status).toBe(200);
            expect(result.data.name).toBe("Get Product");
        });

        it("should return 404 if product does not exist", async () => {
            const result = await ProductService.get(storeId, "non-existent-id");
            expect(result.success).toBe(false);
            expect(result.status).toBe(404);
            expect(result.error?.code).toBe("NOT_FOUND");
        });
    });

    describe("Update", () => {
        it("should update a product successfully", async () => {
            const created = await ProductService.create(
                {
                    name: "Old Name",
                    description: "Old Desc",
                    price: 5.0,
                    availability:
                        [{dayOfWeek: [1, 2], startTime: "09:00", endTime: "17:00", timezone: DateTime.now().zoneName}],
                    modifiers: [{name: "Small", priceDelta: -1}],
                },
                storeId
            );

            const updateInput = {
                name: "New Name",
                description: "New Desc",
                price: 10.0,
                availability: [{
                    dayOfWeek: [2],
                    startTime: "10:00",
                    endTime: "14:00",
                    timezone: DateTime.now().zoneName
                }],
                modifiers: [{id: created.data.product.modifiers[0].id, name: "Large", priceDelta: 3}],
            };

            const result = await ProductService.update(
                updateInput,
                storeId,
                created.data.product.id,
                userId
            );
            console.log(object_stringify({updateInput, result}))

            expect(result.success).toBe(true);
            expect(result.status).toBe(200);
            expect(result.data.name).toBe("New Name");
            expect(result.data.availability[0].dayOfWeek).toContain(2);
            expect(result.data.modifiers[0].name).toBe("Large");
        });

        it("should return 404 if product not found in store", async () => {
            const updateInput: ProductUpdateInput = {
                name: "Doesn't matter",
                description: "",
                price: 0,
                availability: [],
                modifiers: [],
            };

            const result = await ProductService.update(
                updateInput,
                storeId,
                "fake-id",
                userId
            );
            expect(result.success).toBe(false);
            expect(result.status).toBe(404);
            expect(result.error).toBe("Product not found in this store");
        });
    });

    describe("Remove", () => {
        it("should remove an existing product", async () => {
            const created = await ProductService.create(
                {
                    name: "Delete Me",
                    description: "",
                    price: 1,
                    availability: [],
                    modifiers: [],
                },
                storeId
            );

            const result = await ProductService.remove(
                storeId,
                created.data.product.id,
                userId
            );

            expect(result.success).toBe(true);
            expect(result.status).toBe(204);

            const after = await ProductService.get(storeId, created.data.product.id);
            expect(after.success).toBe(false);
            expect(after.status).toBe(404);
        });

        it("should return 404 when removing non-existent product", async () => {
            const result = await ProductService.remove(storeId, "fake-id", userId);
            expect(result.success).toBe(false);
            expect(result.status).toBe(404);
        });
    });

    describe("List", () => {
        it("should list products with pagination", async () => {
            await ProductService.create(
                {name: "Prod1", description: "", price: 1, availability: [], modifiers: []},
                storeId
            );
            await ProductService.create(
                {name: "Prod2", description: "", price: 2, availability: [], modifiers: []},
                storeId
            );

            const result = await ProductService.list(1, 1, storeId);
            expect(result.success).toBe(true);
            expect(result.status).toBe(200);
            expect(result.data.payload.length).toBe(1);
            expect(result.data.meta.total).toBeGreaterThanOrEqual(2);
            expect(result.data.meta.totalPages).toBeGreaterThanOrEqual(2);
        });
    });
});
