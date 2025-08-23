// lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

// @ts-expect-error global this any
const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    // @ts-expect-error global this any
    globalThis.__prisma = prisma;
}

export {prisma};
