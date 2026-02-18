import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Authentication Routes
router.use('/', authRoutes);

// Users Routes (admin)
router.use('/users', userRoutes);

export default router;