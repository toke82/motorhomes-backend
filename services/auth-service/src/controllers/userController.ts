import { Request, Response } from "express";
import userService from "../services/userService";
import logger from "../utils/logger";

export class UserController {
    // GET /users
    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await userService.getAllUsers(page, limit);

            res.status(200).json({
                success: true,
                data: result.users,
                pagination: result.pagination,
            });
        } catch (error) {
            logger.error('Get all users error:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to get users',
            });
        }
    }

    // GET /users/:id
    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const user = await userService.getUserById(id);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            logger.error('Get user bu ID error:', error);

            const message = error instanceof Error ? error.message : 'Failed to get user';
            const statusCode = message === 'User not found' ? 404 : 500;

            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }

    // PUT /users/:id
    async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { firstName, lastName, role, isActive } = req.body;

            const user = await userService.updateUser(id, {
                firstName,
                lastName,
                role,
                isActive,
            });

            res.status(200).json({
                success: true,
                data: user,
                message: 'User updated successfully',
            });
        } catch (error) {
            logger.error('Update user error:', error);

            const message = error instanceof Error ? error.message : 'Failed to update user';
            const statusCode = message === 'User not found' ? 404 : 500;

            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }

    // DELTE /users/:id
    async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            await userService.deleteUser(id);

            res.status(200).json({
                success: true,
                message: 'User deactivated successfully',
            });
        } catch (error) {
            logger.error('Delete user error:', error);

            const message = error instanceof Error ? error.message : 'Failed to delete user';
            const statusCode = message === 'User not found' ? 404 : 500;

            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }
}

export default new UserController();