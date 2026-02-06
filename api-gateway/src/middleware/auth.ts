import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '@microservices/config';
import { JwtPayload } from '@microservices/types';
import logger from '../utils/logger';

// Extend the Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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
    logger.debug(`User authenticated: ${decoded.userId} (${decoded.email})`);
    next();
  } catch (error) {
    logger.warn(`Invalid token attempt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

// Optional middleware - allows requests without token but adds user if it exists
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    logger.debug(`Optional auth - User identified: ${decoded.userId}`);
  } catch (error) {
    // Invalid token but we do not block the request
    logger.debug('Optional auth - Invalid token, continuing without user');
  }

  next();
};

// Middleware to verify roles
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
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};