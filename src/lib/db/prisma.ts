// lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

// Extend global type for Prisma instance
declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

// Create Prisma client with explicit database URL from environment
const createPrismaClient = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
};

// Use global instance in development to prevent multiple connections
// Create new instance in production for each request
const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = prisma;
}
export { prisma };