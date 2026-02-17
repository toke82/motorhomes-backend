import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from '@microservices/config';
import logger from './utils/logger';
import prisma from './db/prisma';
import redisClient from './db/redis';
import routes from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Verify connection to PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    
    // Verify connection to Redis
    await redisClient.ping();
    
    res.json({
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: 'connected',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({
    name: 'Auth Service',
    message: 'Auth Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      register: 'POST /register',
      loging: 'POST /login',
      logout: 'POST /logout',
      refresh: 'POST /refresh',
      me: 'GET /me',
      changePassword: 'PUT /change-password',
      users: 'Get /users (admin)'
    },
  });
});

// API Routes
app.use('/', routes);

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = config.authService.port;

app.listen(PORT, () => {
  logger.info(`🚀 Auth Service running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🗄️  Database: ${config.database.url.split('@')[1]?.split('?')[0] || 'configured'}`);
  logger.info(`💾 Redis: ${config.redis.host}:${config.redis.port}`);
});

// Graceful closure handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

export default app;