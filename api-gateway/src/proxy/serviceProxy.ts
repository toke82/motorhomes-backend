import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import config from '@microservices/config';
import logger from '../utils/logger';

// Proxy base configuration
const baseProxyOptions: Partial<Options> = {
  changeOrigin: true,
  logLevel: 'warn',
  onProxyReq: (proxyReq, req, res) => {
    // Add custom headers
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
    proxyReq.setHeader('X-Forwarded-By', 'api-gateway');
    
    logger.debug(`Proxying ${req.method} ${req.url} to ${proxyReq.getHeader('host')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.debug(`Received response from service: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    logger.error('Proxy error:', {
      error: err.message,
      url: req.url,
      method: req.method,
    });
    
    if (!res.headersSent) {
      (res as any).status(503).json({
        success: false,
        error: 'Service temporarily unavailable',
        message: config.nodeEnv === 'development' ? err.message : undefined,
      });
    }
  },
};

// Proxy for Auth Service
export const authServiceProxy = createProxyMiddleware({
  ...baseProxyOptions,
  target: config.authService.url,
  pathRewrite: {
    '^/api/auth': '', //Remove /api/auth from the path
  },
});

// Proxy for Notification Service
export const notificationServiceProxy = createProxyMiddleware({
  ...baseProxyOptions,
  target: config.notificationService.url,
  pathRewrite: {
    '^/api/notifications': '',
  },
});

// Proxy for Payment Service
export const paymentServiceProxy = createProxyMiddleware({
  ...baseProxyOptions,
  target: config.paymentService.url,
  pathRewrite: {
    '^/api/payments': '',
  },
});