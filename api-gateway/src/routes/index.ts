import { Router } from 'express';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import {
  authServiceProxy,
  notificationServiceProxy,
  paymentServiceProxy,
} from '../proxy/serviceProxy';

const router = Router();

// =============================================================================
// AUTH SERVICE ROUTES
// =============================================================================

// Public authentication routes (with rate limiting)
router.use('/auth/register', authLimiter, authServiceProxy);
router.use('/auth/login', authLimiter, authServiceProxy);
router.use('/auth/refresh', authLimiter, authServiceProxy);

// Protected authentication paths
router.use('/auth/logout', authenticateToken, authServiceProxy);
router.use('/auth/me', authenticateToken, authServiceProxy);
router.use('/auth/change-password', authenticateToken, authServiceProxy);

// User admin paths (requires ADMIN role)
router.use('/auth/users', authenticateToken, requireRole('ADMIN'), authServiceProxy);

// =============================================================================
// NOTIFICATION SERVICE ROUTES
// =============================================================================

// All notification paths require authentication
router.use('/notifications', authenticateToken, notificationServiceProxy);

// =============================================================================
// PAYMENT SERVICE ROUTES
// =============================================================================

// All payment routes require authentication
router.use('/payments', authenticateToken, paymentServiceProxy);

// Administrative payment routes
router.use(
  '/payments/admin',
  authenticateToken,
  requireRole('ADMIN', 'MODERATOR'),
  paymentServiceProxy
);

export default router;