import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/authService';
import prisma from '../../db/prisma';
import { cache } from '../../db/redis';

// Mock jwt
jest.mock('jsonwebtoken');

describe('AuthService - Unit Tests', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'USER',
                role: 'USER',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const registerData = {
                email: 'test@example.com',
                password: 'Test1234',
                firstName: 'Test',
                lastName: 'User',
            };

            // Mocks
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

            const result = await authService.register(registerData);

            expect(result.user).toEqual(mockUser);
            expect(result.tokens).toHaveProperty('accessToken');
            expect(result.tokens).toHaveProperty('refreshToken');
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerData.email }
            });
        });

        it('should throw error if email already exists', async () => {
            const existingUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

            const registerData = {
                email: 'test@example.com',
                password: 'Test1234',
            };

            await expect(authService.register(registerData)).rejects.toThrow(
                'Email already registered'
            );
        });

        it('should hash the password before saving', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'USER',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

            const registerData = {
                email: 'test@example.com',
                password: 'Test1234',
            };

            await authService.register(registerData);

            const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0];
            const savedPassword = createCall.data.password;

            //Verify that the password was hashed
            expect(savedPassword).not.toBe('Test1234');
            const isValidHash = await bcrypt.compare('Test1234', savedPassword);
            expect(isValidHash).toBe(true);
        });
    });

    describe('login', () => {
        it('should login user with a valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('Test1234', 10);
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                role: 'USER',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

            const credentials = {
                email: 'test@example.com',
                password: 'Test1234',
            };

            const result = await authService.login(credentials);

            expect(result.user.email).toBe('test@example.com');
            expect(result.tokens).toHaveProperty('accessToken');
            expect(result.tokens).toHaveProperty('refreshToken');
        });

        it('should throw error with this invalid email', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const credentials = {
                email: 'invalid@example.com',
                password: 'Test1234',
            };

            await expect(authService.login(credentials)).rejects.toThrow(
                'Invalid credentials'
            );
        });

        it('should throw error with invalid password', async () => {
            const hashedPassword = await bcrypt.hash('Test1234', 10);
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: true,
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const credentials = {
                email: 'test@example.com',
                password: 'WrongPassword',
            };

            await expect(authService.login(credentials)).rejects.toThrow(
                'Invalid credentials'
            );
        });

        it('should throw error if account is deactivated', async () => {
            const hashedPassword = await bcrypt.hash('Test1234', 10);
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: false,
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const credentials = {
                email: 'test@example.com',
                password: 'Tets1234',
            };

            await expect(authService.login(credentials)).rejects.toThrow(
                'Account is deactivated'
            );
        });
    });

    describe('logout', () => {
        it('should invalidate refresh token', async () => {
            (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
            (cache.set as jest.Mock).mockResolvedValue('OK');

            const refreshToken = 'valid-refresh-token';

            await authService.logout(refreshToken);

            expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { token: refreshToken },
            });
            expect(cache.set).toHaveBeenCalledWith(
                `blacklist:${refreshToken}`,
                'true',
                604800
            );
        });
    });

    describe('refreshToken', () => {
        it('should refresh tokens with a valid refresh token', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'USER',
            };

            const mockTokenRecord = {
                id: 'token-123',
                token: 'valid-refresh-token',
                userId: 'user-123',
                expiresAt: new Date(Date.now() + 86400000), // 1 day in future
                user: mockUser,
            };

            (cache.exists as jest.Mock).mockResolvedValue(false);
            (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockTokenRecord);
            (prisma.refreshToken.delete as jest.Mock).mockResolvedValue({});
            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
            (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });
            (jwt.sign as jest.Mock).mockReturnValue('new-mock-token');

            const result = await authService.refreshToken('valid-refresh-token');

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(prisma.refreshToken.delete).toHaveBeenCalled();
        });

        it('should throw error if token is blacklisted', async () => {
            (cache.exists as jest.Mock).mockResolvedValue(true);

            await expect(
                authService.refreshToken('blacklisted-token')
            ).rejects.toThrow('Token has been revoked');
        });

        it('should throw error if token not found', async () => {
            (cache.exists as jest.Mock).mockResolvedValue(false);
            (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
                authService.refreshToken('invalid-token')
            ).rejects.toThrow('Invalid refresh token');
        });

        it('should throw error if token expired', async () => {
            const mockTokenRecord = {
                id: 'token-123',
                token: 'expired-token',
                expiresAt: new Date(Date.now() - 86400000), // 1 day in past
            };

            (cache.exists as jest.Mock).mockResolvedValue(false);
            (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockTokenRecord);
            (prisma.refreshToken.delete as jest.Mock).mockResolvedValue({});

            await expect(authService.refreshToken('expired-token')).rejects.toThrow(
                'Refresh token expired'
            );
        });
    });

    describe('changedPassword', () => {
        it('should change password successfully', async () => {
            const hashedPassword = await bcrypt.hash('OldPassword123', 10);
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.user.update as jest.Mock).mockResolvedValue({});
            (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

            await authService.changePassword('user-123', 'OldPassword123', 'NewPassword123');

            expect(prisma.user.update).toHaveBeenCalled();
            expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'user-123'},
            })
        });

        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);


            await expect(
                authService.changePassword('invalid-user', 'Old123', 'New123')
            ).rejects.toThrow('User not found');
        });

        it('should throw error if current password is incorrect', async () => {
            const hashedPassword = await bcrypt.hash('OldPassword123', 10);
            const mockUser = {
                id: 'user-123',
                password: hashedPassword,
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            await expect(
                authService.changePassword('user-123', 'WrongPassword', 'NewPassword123')
            ).rejects.toThrow('Current password is incorrect');
        });
    });

    describe('getCurrentUser', () => {
        it('should return user data', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                firsName: 'Test',
                lastName: 'User',
                role: 'USER',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await authService.getCurrentUser('user-123');

            expect(result).toEqual(mockUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123'},
                select: expect.any(Object),
            });
        });

        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(authService.getCurrentUser('invalid-id')).rejects.toThrow(
                'User not found'
            );
        });
    });
});