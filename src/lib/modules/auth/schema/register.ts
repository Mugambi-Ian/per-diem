import {z} from "zod";
import {DateTime, IANAZone} from "luxon";

const passwordSchema = z.string()
    .min(12, "Password must be at least 12 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .refine((password) => {
        // Check for common passwords (exact matches only)
        const commonPasswords = ['password123', '123456789', 'qwerty123', 'admin123', 'letmein123'];
        const lowerPassword = password.toLowerCase();
        return !commonPasswords.includes(lowerPassword);
    }, "Password is too common");

export const schema_register = z.object({
    email: z.preprocess(
        (val) => typeof val === 'string' ? val.trim() : val,
        z.string()
            .min(1, "Email is required")
            .email("Invalid email format")
            .refine(val => val.length > 0, "Email cannot be empty after trimming")
    ),
    password: passwordSchema,
    fullName: z.preprocess(
        (val) => typeof val === 'string' ? val.trim() : val,
        z.string()
            .min(1, "Full name is required")
            .refine(val => val.length >= 2, "Full name must be at least 2 characters after trimming")
            .refine(val => val.length <= 100, "Full name too long")
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
    )
});