import {describe, it, expect, beforeEach} from '@jest/globals';
import {AuthService} from '@/lib/modules/auth/service/auth.service';
import {createTestUser, createTestRefreshToken,testPrisma} from '@/__tests__/db.setup';
import {server_hash_password} from '@/lib/modules/auth/utils/password';

describe('AuthService Integration Tests', () => {
    beforeEach(async () => {
        // Database cleanup is handled by db.setup.js
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: `newuser-${Date.now()}@example.com`,
                password: 'SecurePass123!',
                fullName: 'New User',
                timezone: 'America/New_York'
            };

            const result = await AuthService.register(userData);

            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.email).toBe(userData.email);

            // Verify user was created in database
            const dbUser = await testPrisma().user.findUnique({
                where: {email: userData.email}
            });

            expect(dbUser).toBeDefined();
            expect(dbUser?.fullName).toBe(userData.fullName);
            expect(dbUser?.timezone).toBe(userData.timezone);
            expect(dbUser?.passwordHash).not.toBe(userData.password); // Should be hashed
        });

        it('should reject registration with existing email', async () => {
            const email = `existing-${Date.now()}@example.com`;
            // Create a user first
            const existingUser = await createTestUser({
                email: email,
                fullName: 'Existing User'
            });

            const userData = {
                email: email,
                password: 'SecurePass123!',
                fullName: 'Another User'
            };

            await expect(AuthService.register(userData))
                .rejects.toThrow('User already exists');
        });

        it('should register user without timezone', async () => {
            const userData = {
                email: `notimezone-${Date.now()}@example.com`,
                password: 'SecurePass123!',
                fullName: 'No Timezone User'
            };

            const result = await AuthService.register(userData);

            expect(result).toBeDefined();
            expect(result.email).toBe(userData.email);

            const dbUser = await testPrisma().user.findUnique({
                where: {email: userData.email}
            });

            expect(dbUser?.timezone).toBeNull();
        });

        it('should hash password securely', async () => {
            const userData = {
                email: `secure-${Date.now()}@example.com`,
                password: 'VerySecurePass123!@#',
                fullName: 'Secure User'
            };

            await AuthService.register(userData);

            const dbUser = await testPrisma().user.findUnique({
                where: {email: userData.email}
            });

            expect(dbUser?.passwordHash).not.toBe(userData.password);
            expect(dbUser?.passwordHash).toMatch(/^\$argon2id\$/); // Argon2 hash format
        });
    });

    describe('login', () => {
        it('should login user with correct credentials', async () => {
            const password = 'SecurePass123!';
            const passwordHash = await server_hash_password(password);
            const email = `login-${Date.now()}@example.com`;

            const user = await createTestUser({
                email: email,
                passwordHash,
                fullName: 'Login User'
            });
            const loginData = {
                email,
                password,
                timezone: 'America/Los_Angeles'
            };

            const result = await AuthService.login(loginData);

            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(result.refreshTokenPlain).toBeDefined();
            expect(result.refreshTokenId).toBeDefined();
            expect(result.user.id).toBe(user.id);
            expect(result.user.email).toBe(user.email);
            expect(result.expiresAt).toBeInstanceOf(Date);

            // Verify refresh token was created in database
            const dbToken = await testPrisma().refreshToken.findUnique({
                where: {id: result.refreshTokenId}
            });

            expect(dbToken).toBeDefined();
            expect(dbToken?.userId).toBe(user.id);
            expect(dbToken?.revoked).toBe(false);
            expect(dbToken?.expiresAt).toEqual(result.expiresAt);

            // Verify timezone was updated
            const updatedUser = await testPrisma().user.findUnique({
                where: {id: user.id}
            });
            expect(updatedUser?.timezone).toBe('America/Los_Angeles');
        });

        it('should reject login with incorrect password', async () => {
            const password = 'SecurePass123!';
            const passwordHash = await server_hash_password(password);
            const email = `wrongpass-${Date.now()}@example.com`;

            await createTestUser({
                email: email,
                passwordHash,
                fullName: 'Wrong Pass User'
            });

            const loginData = {
                email: email,
                password: 'WrongPassword123!'
            };

            await expect(AuthService.login(loginData))
                .rejects.toThrow('Invalid credentials');
        });

        it('should reject login with non-existent email', async () => {
            const loginData = {
                email: `nonexistent-${Date.now()}@example.com`,
                password: 'SecurePass123!'
            };

            await expect(AuthService.login(loginData))
                .rejects.toThrow('Invalid credentials');
        });

        it('should handle login without timezone update', async () => {
            const password = 'SecurePass123!';
            const passwordHash = await server_hash_password(password);
            const email = `notimezone-${Date.now()}@example.com`;

            const user = await createTestUser({
                email: email,
                passwordHash,
                fullName: 'No Timezone User',
                timezone: 'America/New_York'
            });

            const loginData = {
                email: email,
                password: 'SecurePass123!'
                // No timezone specified
            };

            const result = await AuthService.login(loginData);

            expect(result).toBeDefined();

            // Verify timezone was not changed
            const updatedUser = await testPrisma().user.findUnique({
                where: {id: user.id}
            });
            expect(updatedUser?.timezone).toBe('America/New_York');
        });

        it('should create refresh token with correct expiration', async () => {
            const password = 'SecurePass123!';
            const passwordHash = await server_hash_password(password);
            const email = `expiration-${Date.now()}@example.com`;

            await createTestUser({
                email: email,
                passwordHash,
                fullName: 'Expiration User'
            });

            const loginData = {
                email: email,
                password: 'SecurePass123!'
            };

            const result = await AuthService.login(loginData);

            expect(result.expiresAt).toBeInstanceOf(Date);

            // Check that expiration is in the future
            const now = new Date();
            expect(result.expiresAt.getTime()).toBeGreaterThan(now.getTime());

            // Check that expiration is roughly 30 days from now (default)
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            expect(result.expiresAt.getTime()).toBeLessThan(thirtyDaysFromNow.getTime());
        });
    });

    describe('logout', () => {
        it('should revoke refresh token on logout', async () => {
            const user = await createTestUser({
                email: `logout-${Date.now()}@example.com`,
                fullName: 'Logout User'
            });

            const token = await createTestRefreshToken(user.id, {
                revoked: false
            });

            await AuthService.logout(token.id);

            // Verify token was revoked
            const dbToken = await testPrisma().refreshToken.findUnique({
                where: {id: token.id}
            });

            expect(dbToken?.revoked).toBe(true);
        });

        it('should handle logout of non-existent token gracefully', async () => {
            const nonExistentId = 'non-existent-token-id';

            // Should not throw
            await expect(AuthService.logout(nonExistentId)).resolves.toBeUndefined();
        });
    });

    describe('Account Lockout', () => {
        it('should lock account after multiple failed attempts', async () => {
            const password = 'SecurePass123!';
            const passwordHash = await server_hash_password(password);
            const email = `lockout-${Date.now()}@example.com`;

            await createTestUser({
                email: email,
                passwordHash,
                fullName: 'Lockout User'
            });

            // Attempt multiple failed logins
            for (let i = 0; i < 5; i++) {
                try {
                    await AuthService.login({
                        email: email,
                        password: 'WrongPassword123!'
                    });
                } catch (error) {
                    // Expected to fail
                }
            }

            // Next login attempt should be locked
            await expect(AuthService.login({
                email: email,
                password: 'SecurePass123!'
            })).rejects.toThrow(/Account is locked/);
        });

        it('should reset failed attempts on successful login', async () => {
            const password = 'SecurePass123!';
            const passwordHash = await server_hash_password(password);
            const email = `reset-${Date.now()}@example.com`;

            await createTestUser({
                email: email,
                passwordHash,
                fullName: 'Reset User'
            });

            // Attempt failed login
            try {
                await AuthService.login({
                    email: email,
                    password: 'WrongPassword123!'
                });
            } catch (error) {
                // Expected to fail
            }

            // Successful login should reset failed attempts
            const result = await AuthService.login({
                email: email,
                password: 'SecurePass123!'
            });

            expect(result).toBeDefined();

            // Verify user can login again
            const user = await testPrisma().user.findUnique({
                where: {email: email}
            });

            expect(user?.failedLoginAttempts).toBe(0);
            expect(user?.lockedUntil).toBeNull();
        });
    });
});
