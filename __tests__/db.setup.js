// __tests__/setup.integration.ts
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as dbModule from "@/lib/db/prisma"; // import module to override prisma

// Unique DB name per Jest worker
const dbName = `test_${Date.now()}_${Math.random()}`;
const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) throw new Error('DATABASE_URL must be set');

const url = new URL(baseUrl);
const rootDb = `${url.protocol}//${url.username}:${url.password}@${url.hostname}:${url.port}`;
url.pathname = `/${dbName}`;
const testDbUrl = url.toString();

let testPrismaClient;

beforeAll(async () => {
    // Create test DB
    execSync(`psql --dbname="${rootDb}" -c "CREATE DATABASE \\"${dbName}\\";"`, { stdio: 'inherit' });

    // Push schema
    execSync(
        `npx prisma db push --force-reset --skip-generate --schema=./prisma/schema.prisma`,
        { env: { ...process.env, DATABASE_URL: testDbUrl }, stdio: 'inherit' }
    );

    // Override DATABASE_URL for this test session
    process.env.DATABASE_URL = testDbUrl;

    // Create new Prisma client pointing to the test DB
    testPrismaClient = new PrismaClient({
        datasources: { db: { url: testDbUrl } },
    });
    globalThis.__prisma = testPrismaClient;

    // Override imported prisma in db module
    (dbModule).prisma = testPrismaClient;

    await testPrismaClient.$connect();
    console.log(`✅ Test database [${dbName}] connected`);
});

afterAll(async () => {
    if (testPrismaClient) await testPrismaClient.$disconnect();

    execSync(
        `psql --dbname="${rootDb}" -c "DROP DATABASE IF EXISTS \\"${dbName}\\" WITH (FORCE);"`,
        { stdio: 'inherit' }
    );
    console.log(`🗑️ Test database [${dbName}] dropped`);
});

export const testPrisma = () => testPrismaClient;

export const waitForPrisma = async (retries = 10, intervalMs = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await testPrisma().$queryRaw`SELECT 1`;
        } catch (error) {
            console.warn(`⚠️ Prisma not ready (attempt ${attempt}/${retries}):`, error.message);
            if (attempt === retries) throw new Error("❌ Prisma failed to connect after max retries");
            await new Promise(res => setTimeout(res, intervalMs));
        }
    }
};

export const isLoaded = async () => waitForPrisma(10, 100);


// -------- test data factories --------
export const createTestUser = async (overrides = {}) => {
    if (await isLoaded()) {
        return testPrisma().user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                fullName: `Test User ${Date.now()}`,
                passwordHash: 'hashed-password-placeholder',
                timezone: 'America/New_York',
                ...overrides,
            },
        });
    }
};

export const createTestStore = async (userId, overrides = {}) => {
    if (await isLoaded()) {
        return testPrisma().store.create({
            data: {
                name: `Test Store ${Date.now()}`,
                slug: `test-store-${Date.now()}`,
                address: '123 Test St',
                timezone: 'America/New_York',
                lat: 40.7128,
                lng: -74.0060,
                userId,
                ...overrides,
            },
        });
    }
};

export const createTestRefreshToken = async (userId, overrides = {}) => {
    if (await isLoaded()) {
        return testPrisma().refreshToken.create({
            data: {
                tokenHash: 'hashed-token-placeholder',
                userId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                revoked: false,
                ...overrides,
            },
        });
    }
};

export const createTestProduct = async (storeId, overrides = {}) => {
    if (await isLoaded()) {
        return testPrisma().product.create({
            data: {
                name: `Test Product ${Date.now()}`,
                price: 9.99,
                description: 'A test product for testing',
                storeId,
                cacheTTL: 300,
                ...overrides,
            },
        });
    }
};
