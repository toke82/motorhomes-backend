import request from 'supertest';
import app from '../../index';
import prisma from '../../db/prisma';
import { cache } from '../../db/redis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@microservices/config';

// Jwt Mock before tests
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}));

describe('Auth Endpoints - Integration Tests', () => {
    // Helper to generate valid tokens
    const generateValidToken = (userId: string, email: string, role: string) => {
        const realJWT = jest.requireActual('jsonwebtoken');
        return realJWT.sign(
            { userId, email, role },
            config.jwt.secret,
            { expiresIn: '1h' } as jwt.SignOptions
        );
    };

    beforeEach(() => {
        //Reset mocks before each test
        jest.clearAllMocks();
        //By default, jwt.sign returns a mocked token
        (jwt.sign as jest.Mock).mockReturnValue('mocked-jwt-token');
    });

    describe('POST /register', () => {
        it('should register a new user', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'user-123',
                email: 'newuser@example.com',
                firstName: 'New',
                lastName: 'User',
                role: 'USER',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

            const response = await request(app)
                .post('/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'Test1234',
                    firstName: 'New',
                    lastName: 'User',
                })
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('newuser@example.com');
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should return 400 for invalid email', async () => {
            const response = await request(app)
                .post('/register')
                .send({
                    email: 'invalid-email',
                    password: 'Test1234',
                })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
        });

        it('should return 400 for weak password', async () => {
            const response = await request(app)
                .post('/register')
                .send({
                    email: 'test@example.com',
                    password: 'weak',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
        });

        it('should return 409 if email already exists', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'existing-user',
                email: 'existing@example.com',
            });

            const response = await request(app)
                .post('/register')
                .send({
                    email: 'existing@example.com',
                    password: 'Test1234',
                })
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Email already registered');
        });
    });

    describe('POST /login', () => {
        it('should login with valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('Test1234', 10);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                role: 'USER',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

            const response = await request(app)
                .post('/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test1234',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should return 401 for invalid email', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'Test1234',
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should return 401 for invalid password', async () => {
            const hashedPassword = await bcrypt.hash('Test1234', 10);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: true,
            });

            const response = await request(app)
                .post('/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword',
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should return 403 for deactivated account', async () => {
            const hashedPassword = await bcrypt.hash('Test1234', 10);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: false,
            });

            const response = await request(app)
                .post('/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test1234',
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Account is deactivated');
        });
    });

    describe('GET /me', () => {
        it('should return current user with a valid token', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'USER',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            //You would need to generate a valid token here
            //Or mock the authentication middleware
            const validToken = generateValidToken('user-123', 'test@example.com', 'USER');

            (jwt.verify as jest.Mock).mockReturnValue({
                userId: 'user-123',
                email: 'test@example.com',
                role: 'USER'
            });

            const response = await request(app)
                .get('/me')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('test@example.com');
        });

        it('should return 401 without token', async () => {
            const response = await request(app).get('/me').expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Access token required');
        });
    });

    describe('POST /logout', () => {
        it('should logout successfully', async () => {
            (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
            (cache.set as jest.Mock).mockResolvedValue('OK');

            //You would need to generate a valid token here
            //Or mock the authentication middleware
            const validToken = generateValidToken('user-123', 'test@example.com', 'USER');

            (jwt.verify as jest.Mock).mockReturnValue({
                userId: 'user-123',
                email: 'test@example.com',
                role: 'USER'
            });            

            const response = await request(app)
                .post('/logout')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    refreshToken: 'valid-refresh-token'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logged out successfully');
        });
    });

    describe('POST /refresh', () => {
        it('should refresh tokens with valid refresh token', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'USER',
            };

            const validRefreshToken = jwt.sign(
                { userId: 'user-123', email: 'test@example.com', role: 'USER' },
                config.jwt.refreshSecret,
                { expiresIn: '7d' } as jwt.SignOptions
            );

            (cache.exists as jest.Mock).mockResolvedValue(false);
            (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
                id: 'token-123',
                token: 'valid-refresh-token',
                userId: 'user-123',
                expiresAt: new Date(Date.now() + 86400000),
                user: mockUser,
            });
            (prisma.refreshToken.delete as jest.Mock).mockResolvedValue({});
            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

            const response = await request(app)
                .post('/refresh')
                .send({
                    refreshToken: validRefreshToken
                })
                expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should return 401 for invalid refresh token', async () => {
            (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/refresh')
                .send({
                    refreshToken: 'invalid-token'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid refresh token');
        });
    });

    // Clean connections after all tests
    afterAll(async () => {
        //Close connections to prevent Jest from hanging
       await prisma.$disconnect();
    });
});