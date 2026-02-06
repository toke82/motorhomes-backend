import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Middleware to log all requests
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log in when the answer ends
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
      userId: req.user?.userId || 'anonymous',
    };

    const logMessage = `${logData.method} ${logData.url} ${logData.status} ${logData.duration} - ${logData.userId}`;

    if (res.statusCode >= 500) {
      logger.error(logMessage, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(logMessage, logData);
    } else {
      logger.info(logMessage, logData);
    }
  });

  next();
};

// Middleware to log errors
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.userId,
  });

  next(err);
};