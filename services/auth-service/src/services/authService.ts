import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@microservices/config';
import { RegisterData, LoginCredentials, AuthTokens, JwtPayload, UserRole } from '@microservices/types';
import prisma from '../db/prisma';
import { cache } from '../db/redis';
import logger from '../utils/logger';

export class AuthService {
    //Register new user
    async register(data: RegisterData): Promise<{ user: any; tokens: AuthTokens}> {
        //Check if the email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new Error('Email already registered');
        }

        //Password hash
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                role: UserRole.USER,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role as UserRole);

        logger.info(`User registered: ${user.email}`);

        return { user, tokens };
    }

    // Login
    async login(credentials: LoginCredentials): Promise<{ user: any; tokens: AuthTokens }> {
        // Search user
        const user = await prisma.user.findUnique({
            where: { email: credentials.email },
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if the user is active
        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role as UserRole);

        logger.info(`User logged in: ${user.email}`);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            tokens,
        };
    }

    // Logout
    async logout(refreshToken: string): Promise<void> {
        //Invalidate the refresh token
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
        });

        //Add to blacklist in Redis (optional)
        await cache.set(`blacklist:${refreshToken}`, 'true', 604800); // 7 days

        logger.info('User logged out');
    }

    // Refresh token
    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        //Check if it is on blacklist
        const isBlacklisted = await cache.exists(`blacklist:${refreshToken}`);
        if (isBlacklisted) {
            throw new Error('Token has been revoked');
        }

        //Look for the refresh token in the DB
        const tokenRecord = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!tokenRecord) {
            throw new Error('Invalid refresh token');
        }

        //Check if it expired
        if (new Date() > tokenRecord.expiresAt) {
            await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
            throw new Error('Refresh token expired');
        }

        //Verify the JWT token
        try {
            jwt.verify(refreshToken, config.jwt.refreshSecret);
        } catch (error) {
            await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
            throw new Error('Invalid refresh token');
        }

        //Delete the old token
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

        // Generate new tokens
        const tokens = await this.generateTokens(
            tokenRecord.user.id,
            tokenRecord.user.email,
            tokenRecord.user.role as UserRole
        );

        logger.info(`Token refreshed for user: ${tokenRecord.user.email}`);

        return tokens;
    }

    // Change password
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        //Check current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        //Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        //Invalidate all user refresh tokens
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });

        logger.info(`Password changed for user: ${user.email}`);
    }

    // Generate tokens (access + refresh)
    private async generateTokens(
        userId: string,
        email: string,
        role: UserRole
    ): Promise<AuthTokens> {
        const payload: JwtPayload = {
            userId,
            email,
            role: role as string,  // Convert enum to string
        };

        // Access token
        const accessToken = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        } as jwt.SignOptions);

        // Refresh token
        const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn,
        } as jwt.SignOptions);

        //Save refresh token in BD
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });

        return { accessToken, refreshToken};
    }

    // Get current user
    async getCurrentUser(userId: string): Promise<any> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }
}

export default new AuthService();