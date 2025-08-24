import {describe, it, expect, beforeEach} from '@jest/globals';
import {NextRequest} from 'next/server';
import {PostAuthRegister} from '@/lib/modules/auth/register.handler';
import {prisma} from '@/lib/db/prisma';

describe('Register Handler Integration Tests', () => {
    let mockRequest: NextRequest;

    beforeEach(() => {
        // Reset mock request for each test
        mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    });

    describe('Successful Registration', () => {
        it('should register new user successfully', async () => {
            const body = {
                email: 'newuser@example.com',
                password: 'SecurePass123!',
                fullName: 'New User',
                timezone: 'Africa/Nairobi'
            };
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const response = await PostAuthRegister(mockRequest);

            expect(response.success).toBe(true);
            expect(response.status).toBe(201);
            expect(response.data).toBeDefined();
            expect(response.data?.user).toBeDefined();
            expect(response.data?.user.email).toBe('newuser@example.com');
            expect(response.data?.user.id).toBeDefined();

            // Verify user was created in database
            const dbUser = await prisma.user.findUnique({
                where: {email: 'newuser@example.com'}
            });

            expect(dbUser).toBeDefined();
            expect(dbUser?.fullName).toBe('New User');
            expect(dbUser?.timezone).toBe('Africa/Nairobi');
            expect(dbUser?.passwordHash).not.toBe(body.password); // Should be hashed
            expect(dbUser?.passwordHash).toMatch(/^\$argon2id\$/); // Argon2 hash format
        });

        it('should register user without timezone', async () => {
            const body = {
                email: 'notimezone@example.com',
                password: 'SecurePass123!',
                fullName: 'No Timezone User'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const response = await PostAuthRegister(mockRequest);

            expect(response.success).toBe(true);
            expect(response.status).toBe(201);
            expect(response.data?.user).toBeDefined();
            expect(response.data?.user.email).toBe('notimezone@example.com');

            // Verify user was created without timezone
            const dbUser = await prisma.user.findUnique({
                where: {email: 'notimezone@example.com'}
            });

            expect(dbUser).toBeDefined();
            expect(dbUser?.timezone).toBeNull();
        });

        it('should register user with different timezone', async () => {
            const body = {
                email: 'pacific@example.com',
                password: 'SecurePass123!',
                fullName: 'Pacific User',
                timezone: 'America/Los_Angeles'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const response = await PostAuthRegister(mockRequest);

            expect(response.success).toBe(true);
            expect(response.status).toBe(201);

            // Verify user was created with correct timezone
            const dbUser = await prisma.user.findUnique({
                where: {email: 'pacific@example.com'}
            });

            expect(dbUser).toBeDefined();
            expect(dbUser?.timezone).toBe('America/Los_Angeles');
        });
    });

    describe('Failed Registration', () => {
        it('should reject registration with existing email', async () => {
            await prisma.user.create({
                data: {
                    email: 'existing@example.com',
                    passwordHash: 'hashed-password',
                    fullName: 'Existing User'
                }
            });

            const body = {
                email: 'existing@example.com',
                password: 'SecurePass123!',
                fullName: 'Another User'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            await expect(PostAuthRegister(mockRequest)).rejects.toThrow('User already exists');
        });

        it('should handle invalid email format', async () => {
            const body = {
                email: 'invalid-email-format',
                password: 'SecurePass123!',
                fullName: 'Invalid Email User'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            await expect(PostAuthRegister(mockRequest)).rejects.toThrow();
        });

        it('should handle weak password', async () => {
            const body = {
                email: 'weakpass@example.com',
                password: '123', // Too short
                fullName: 'Weak Password User'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            await expect(PostAuthRegister(mockRequest)).rejects.toThrow();
        });

        it('should handle missing required fields', async () => {
            const body = {
                email: 'missing@example.com'
                // Missing password and fullName
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            await expect(PostAuthRegister(mockRequest)).rejects.toThrow();
        });

        it('should handle empty fullName', async () => {
            const body = {
                email: 'empty@example.com',
                password: 'SecurePass123!',
                fullName: ''
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            await expect(PostAuthRegister(mockRequest)).rejects.toThrow();
        });

        it('should handle invalid timezone', async () => {
            const body = {
                email: 'invalidtz@example.com',
                password: 'SecurePass123!',
                fullName: 'Invalid Timezone User',
                timezone: 'Invalid/Timezone'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            await expect(PostAuthRegister(mockRequest)).rejects.toThrow();
        });
    });

    describe('Request Validation', () => {
        it('should handle malformed JSON', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: 'invalid-json',
            });

            await expect(PostAuthRegister(mockRequest)).rejects.toThrow();
        });

        it('should handle empty request body', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: '',
            });

            await expect(PostAuthRegister(mockRequest)).rejects.toThrow();
        });

        it('should handle null request body', async () => {
            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: null as any,
            });

            await expect(PostAuthRegister(mockRequest)).rejects.toThrow();
        });
    });

    describe('Password Security', () => {
        it('should hash password securely', async () => {
            const body = {
                email: 'secure@example.com',
                password: 'VerySecurePass123!@#',
                fullName: 'Secure User'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            await PostAuthRegister(mockRequest);

            // Verify password was hashed
            const dbUser = await prisma.user.findUnique({
                where: {email: 'secure@example.com'}
            });

            expect(dbUser?.passwordHash).not.toBe(body.password);
            expect(dbUser?.passwordHash).toMatch(/^\$argon2id\$/);
        });

        it('should handle special characters in password', async () => {
            const body = {
                email: 'special@example.com',
                password: 'SecurePass123!@#$%^&*()',
                fullName: 'Special Char User'
            };

            mockRequest = new NextRequest('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const response = await PostAuthRegister(mockRequest);

            expect(response.success).toBe(true);
            expect(response.status).toBe(201);
        });
    });
});

