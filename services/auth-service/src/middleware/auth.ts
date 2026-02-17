import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '@microservices/config';
import { JwtPayload } from '@microservices/types';
import logger from '../utils/logger';

//Extend Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    //First try to obtain the header Authorization token
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    //If it is not in Authorization, try to obtain it from the API Gateway headers
    if (!token && req.headers['x-user-id']) {
        //The API Gateway has already validated the token and sent the user data
        req.user = {
            userId: req.headers['x-user-id'] as string,
            email: req.headers['x-user-email'] as string,
            role: req.headers['x-user-role'] as any,
        };
        next();
        return;
    }

    if (!token) {
        res.status(401).json({
            success: false,
            error: 'Access token required',
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        req.user = decoded;
        logger.debug(`User authenticated: ${decoded.userId}`);
        next();
    } catch (error) {
        logger.warn(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        res.status(403).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }
};

export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            logger.warn(`Access denied for user ${req.user.userId} - Required roles: ${roles.join(', ')}`);
            res.status(403).json({
                success: false,
                error: 'Insuficient permissions',
            });
            return;
        }

        next();
    };
};