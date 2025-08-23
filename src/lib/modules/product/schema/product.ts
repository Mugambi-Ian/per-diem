import { z } from "zod";
import {ProductAvailability} from "@/lib/modules/product/utils/enrich";


export const productSchema = z.object({
    name: z.string().min(2),
    price: z.number().nonnegative(),
    description: z.string().optional(),
    availability: z.array(z.object({
        dayOfWeek: z.array(z.number().min(0).max(6)),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        timezone: z.string(),
        recurrenceRule: z.record(z.string(), z.any()).optional(),
        specialDates: z.record(z.string().datetime(),z.boolean()).optional()
    ,
    })).optional(),
    modifiers: z.array(z.object({
        name: z.string(),
        priceDelta: z.number().default(0),
    })).optional()
});


export type ProductInput = {
    name: string;
    price: number;
    description?: string;
    availability?: ProductAvailability[];
    modifiers?: ModifierInput[];
};

export type ModifierInput = {
    name: string;
    priceDelta: number;
};

export type ProductUpdateInput = {
    name: string;
    description?: string;
    price: number;
    availability: ProductAvailability[];
    modifiers: ModifierInput[];
};