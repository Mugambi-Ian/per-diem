import {z} from "zod";

export const schema_register = z.object({
    email: z.email(),
    password: z.string().min(8),
    fullName:z.string().min(2)
});