import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import userRoutes from './user.routes';
import departmentRoutes from './department.routes';
import notificationRoutes from './notification.routes';
import statusRoutes from './status.routes';

const router = Router();

// All routes are prefixed with /api (set in server.ts)
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/status', statusRoutes);

export default router;