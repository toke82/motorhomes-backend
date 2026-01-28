import dotenv from 'dotenv';
import path from 'path';

//Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Gateway
  apiGateway: {
    port: parseInt(process.env.API_GATEWAY_PORT || '3000', 10),
  },
  
  // Auth Service
  authService: {
    port: parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10),
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },
  
  // Notification Service
  notificationService: {
    port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3002', 10),
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002',
  },
  
  // Payment Service
  paymentService: {
    port: parseInt(process.env.PAYMENT_SERVICE_PORT || '3003', 10),
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
  },
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/motorhomes_db?schema=public',
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};

export default config;