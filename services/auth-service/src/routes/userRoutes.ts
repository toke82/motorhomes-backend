import { Router } from 'express';
import userController from '../controllers/userController';
import { updateUserValidation } from '../validators/authValidators';
import { handleValidationErrors } from '../middleware/validateRequest';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/', userController.getAllUsers.bind(userController));

router.get('/:id', userController.getUserById.bind(userController));

router.put(
  '/:id',
  updateUserValidation,
  handleValidationErrors,
  userController.updateUser.bind(userController)
);

router.delete('/:id', userController.deleteUser.bind(userController));

export default router;