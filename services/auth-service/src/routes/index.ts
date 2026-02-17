import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Rutas de autenticación
router.use('/', authRoutes);

// Rutas de usuarios (admin)
router.use('/users', userRoutes);

export default router;