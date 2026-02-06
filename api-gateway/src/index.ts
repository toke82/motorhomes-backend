import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from '@microservices/config';
import logger from './utils/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { requestLogger, errorLogger } from './middleware/requestLogger';
import routes from './routes';

const app = express();

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Helmet - Security with HTTP headers
app.use(helmet());

// CORS - Allowed Source Settings
app.use(
  cors({
    origin: config.nodeEnv === 'production' 
      ? ['https://yourdomain.com'] // Change in production
      : '*',
    credentials: true,
  })
);

// =============================================================================
// PARSING MIDDLEWARE
// =============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================================================
// LOGGING MIDDLEWARE AND RATE LIMITING
// =============================================================================

app.use(requestLogger);
app.use(generalLimiter);

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Gateway information
app.get('/', (req, res) => {
  res.json({
    name: 'API Gateway',
    version: '1.0.0',
    description: 'Central entry point for all microservices',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      notifications: '/api/notifications/*',
      payments: '/api/payments/*',
    },
  });
});

// =============================================================================
// ROUTES - All routes go under /api
// =============================================================================

app.use('/api', routes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Error logging middleware
app.use(errorLogger);

// 404 - Route not found
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url,
  });
});

// Global bug handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
});

// =============================================================================
// START SERVER
// =============================================================================

const PORT = config.apiGateway.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Services configured:`);
  logger.info(`   - Auth Service: ${config.authService.url}`);
  logger.info(`   - Notification Service: ${config.notificationService.url}`);
  logger.info(`   - Payment Service: ${config.paymentService.url}`);
  logger.info(`📝 Logs: ./logs/`);
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // If it doesn't close within 10 seconds, force
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;