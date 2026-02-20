import { Request, Response } from "express";
import authService from "../services/authService";
import logger from "../utils/logger";

export class AuthController {
    // POST /register
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, firstName, lastName } = req.body;

            const result = await authService.register({
                email,
                password,
                firstName,
                lastName,
            });

            res.status(201).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                    refreshToken: result.tokens.refreshToken,
                },
                message: 'User registered successfully',
            });
        } catch (error) {
            logger.error('Registration error:', error);

            const message = error instanceof Error ? error.message : 'Registration failed';
            const statusCode = message === 'Email already registered' ? 409 : 500;

            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }

    // POST / login
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            const result = await authService.login({ email, password });

            res.status(200).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                    refreshToken: result.tokens.refreshToken
                },
                message: 'Login successful',
            });
        } catch (error) {
            logger.error('Login error:', error);

            const message = error instanceof Error ? error.message : 'Login failed';
            const statusCode =
                message === 'Invalid credentials' ? 401 :
                message === 'Account is deactivated' ? 403 :
                500;

            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }

    // POST /logout
    async logout(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            await authService.logout(refreshToken);

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            logger.error('Logout error:', error);

            res.status(500).json({
                success: false,
                error: 'Logout failed',
            });
        }
    }

    // POST /refresh
    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            const tokens = await authService.refreshToken(refreshToken);

            res.status(200).json({
                success: true,
                data: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
                message: 'Token refreshed successfully',
            });
        } catch (error) {
            logger.error('Refresh token error:', error);

            const message = error instanceof Error ? error.message : 'Token refresh failed';
            const statusCode =
                message.includes('Invalid') || message.includes('expired') || message.includes('revoked')
                    ? 401
                    : 500;
            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }

    // GET /me
    async getCurrentUser(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
                return;
            }

            const user = await authService.getCurrentUser(req.user.userId);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            logger.error('Get current user error:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to get user'
            });
        }
    }

    // PU /change-password
    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
                return;
            }

            const { currentPassword, newPassword } = req.body;

            await authService.changePassword(req.user.userId, currentPassword, newPassword);

            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            logger.error('Change password error:', error);

            const message = error instanceof Error ? error.message : 'Password changed failed';
            const statusCode = message === 'Current password is incorrect' ? 400 : 500;

            res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
    }
}

export default new AuthController();