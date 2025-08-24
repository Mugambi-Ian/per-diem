// __tests__/product_enrich.test.ts
import { DateTime } from "luxon";
import { Product } from "@/lib/modules/product/schema/product";
import * as availabilityUtils from "@/lib/modules/product/utils/availability";
import {product_enrich} from "@/lib/modules/product/utils/enrich";

describe("product_enrich", () => {
    let mockProduct: Product;

    beforeEach(() => {
        mockProduct = {
            cacheTTL: 0, lastModified: new Date(), price: 0, storeId: "",
            id: "p1",
            name: "Test Product",
            availability: []
        };
    });

    it("should enrich product with availability info when currently available", () => {
        const now = DateTime.utc(2025, 8, 24, 10, 0);

        // Mock the utility functions
        jest.spyOn(availabilityUtils, "isAvailableNow").mockReturnValue(true);
        jest.spyOn(availabilityUtils, "getNextAvailableTime").mockReturnValue(now.plus({ hours: 2 }));
        jest.spyOn(availabilityUtils, "getAvailabilityStatus").mockReturnValue("Available");

        const result = product_enrich(mockProduct, now);

        expect(result).toMatchObject({
            ...mockProduct,
            isAvailableNow: true,
            availabilityStatus: "Available",
        });

        expect(result.nextAvailableTime?.toISO()).toBe(now.plus({ hours: 2 }).toISO());
    });

    it("should enrich product with availability info when currently unavailable", () => {
        const now = DateTime.utc(2025, 8, 24, 12, 0);

        jest.spyOn(availabilityUtils, "isAvailableNow").mockReturnValue(false);
        jest.spyOn(availabilityUtils, "getNextAvailableTime").mockReturnValue(now.plus({ hours: 5 }));
        jest.spyOn(availabilityUtils, "getAvailabilityStatus").mockReturnValue("Unavailable");

        const result = product_enrich(mockProduct, now);

        expect(result).toMatchObject({
            ...mockProduct,
            isAvailableNow: false,
            availabilityStatus: "Unavailable",
        });

        expect(result.nextAvailableTime?.toISO()).toBe(now.plus({ hours: 5 }).toISO());
    });

    it("should call utility functions with correct arguments", () => {
        const now = DateTime.utc(2025, 8, 24, 9, 0);
        const isAvailableNowSpy = jest.spyOn(availabilityUtils, "isAvailableNow");
        const getNextAvailableTimeSpy = jest.spyOn(availabilityUtils, "getNextAvailableTime");
        const getAvailabilityStatusSpy = jest.spyOn(availabilityUtils, "getAvailabilityStatus");

        product_enrich(mockProduct, now);

        expect(isAvailableNowSpy).toHaveBeenCalledWith(mockProduct.availability, now);
        expect(getNextAvailableTimeSpy).toHaveBeenCalledWith(mockProduct.availability, now);
        expect(getAvailabilityStatusSpy).toHaveBeenCalledWith(mockProduct.availability, now);
    });

    it("should use current time if no 'now' is provided", () => {
        const isAvailableNowSpy = jest.spyOn(availabilityUtils, "isAvailableNow").mockReturnValue(true);
        const getNextAvailableTimeSpy = jest.spyOn(availabilityUtils, "getNextAvailableTime").mockReturnValue(DateTime.utc());
        const getAvailabilityStatusSpy = jest.spyOn(availabilityUtils, "getAvailabilityStatus").mockReturnValue("Available");

        const result = product_enrich(mockProduct);

        expect(isAvailableNowSpy).toHaveBeenCalled();
        expect(getNextAvailableTimeSpy).toHaveBeenCalled();
        expect(getAvailabilityStatusSpy).toHaveBeenCalled();
        expect(result.isAvailableNow).toBe(true);
        expect(result.availabilityStatus).toBe("Available");
    });
});
