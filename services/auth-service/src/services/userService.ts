import { Role } from "@prisma/client";
import prisma from "../db/prisma";
import logger from "../utils/logger";

export class UserService {
    //List all users
    async getAllUsers(page: number = 1, limit: number = 10): Promise<any> {
        const skip = (page -1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
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
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.user.count(),
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get user by ID
    async getUserById(userId: string): Promise<any> {
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

    // Update user
    async updateUser(
        userId: string,
        data: {
            firstName?: string,
            lastName?: string,
            role?: string,
            isActive?: boolean,
        }
    ): Promise<any> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const updateData: any = {};

        if (data.firstName !== undefined) updateData.firstName = data.firstName;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        if (data.role !== undefined) {
            updateData.role = data.role as Role;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
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

        logger.info(`User updated: ${updatedUser.email}`);

        return updatedUser;
    }

    // Deactivated user (soft delete)
    async deleteUser(userId: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Soft delete - only deactivate
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });

        // Delete all refresh tokens
        await prisma.refreshToken.deleteMany({
            where: { id: userId },
        });

        logger.info(`User deactivated: ${user.email}`);
    }

}

export default new UserService();