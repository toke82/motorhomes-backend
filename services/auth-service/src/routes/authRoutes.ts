import { Router } from 'express';
import authController from '../controllers/authController';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  refreshTokenValidation,
} from '../validators/authValidators';
import { handleValidationErrors } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public Routes
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  authController.register.bind(authController)
);

router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  authController.login.bind(authController)
);

router.post(
  '/refresh',
  refreshTokenValidation,
  handleValidationErrors,
  authController.refreshToken.bind(authController)
);

// Protected Routes
router.post(
  '/logout',
  authenticate,
  refreshTokenValidation,
  handleValidationErrors,
  authController.logout.bind(authController)
);

router.get(
  '/me',
  authenticate,
  authController.getCurrentUser.bind(authController)
);

router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword.bind(authController)
);

export default router;