import { z } from "zod";
import { IANAZone } from "luxon";

// User timezone update schema
export const userTimezoneSchema = z.object({
    timezone: z.string()
        .min(1, "Timezone is required")
        .refine((tz) => IANAZone.isValidZone(tz), "Invalid timezone format")
});

// User profile update schema
export const userProfileSchema = z.object({
    fullName: z.string()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name too long")
        .optional(),
    email: z.string()
        .email("Invalid email format")
        .optional(),
    timezone: z.string()
        .refine((tz) => IANAZone.isValidZone(tz), "Invalid timezone format")
        .optional()
});

// User response schema
export const userResponseSchema = z.object({
    id: z.string(),
    email: z.string(),
    fullName: z.string(),
    timezone: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    avocado: z.boolean()
});
