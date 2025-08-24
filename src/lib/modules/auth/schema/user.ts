import {z} from "zod";
import {IANAZone} from "luxon";

export const schema_user = z.object({
    id: z.preprocess(
        (val) => typeof val === 'string' ? val.trim() : val,
        z.string()
            .min(1, "ID is required")
            .refine(val => val.length > 0, "ID cannot be empty after trimming")
    ),
    email: z.preprocess(
        (val) => typeof val === 'string' ? val.trim() : val,
        z.string()
            .min(1, "Email is required")
            .email("Invalid email format")
            .refine(val => val.length > 0, "Email cannot be empty after trimming")
    ),
    fullName: z.preprocess(
        (val) => typeof val === 'string' ? val.trim() : val,
        z.string()
            .min(1, "Full name is required")
            .max(255, "Full name too long")
            .refine(val => val.length > 0, "Full name cannot be empty after trimming")
    ),
    timezone: z.preprocess(
        (val) => typeof val === 'string' ? val.trim() : val,
        z.string()
            .optional()
            .refine((tz) => {
                if (!tz) return true;
                return require("luxon").IANAZone.isValidZone(tz);
            }, "Invalid timezone format")
    ),
    avocado: z.boolean().default(true),
    createdAt: z.union([z.date(), z.string()]).transform(val => {
        if (val instanceof Date) return val;
        const date = new Date(val);
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        return date;
    }),
    updatedAt: z.union([z.date(), z.string()]).transform(val => {
        if (val instanceof Date) return val;
        const date = new Date(val);
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        return date;
    })
});

export const UserResponseDTO = {
    id: true,
    email: true,
    fullName: true,
    avocado: true
}