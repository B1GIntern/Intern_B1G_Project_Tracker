import { Router } from 'express';
import authRoutes from './auth.routes';
import dataRoutes from './data.routes';
import departmentRoutes from './department.routes';
import notificationRoutes from './notification.routes';
import seedRoutes from './seed.routes';
import statusRoutes from './status.routes';
import taskRoutes from './task.routes';
import userRoutes from './user.routes';
import testUserRoutes from './test-user-create';
import cleanupRoutes from './cleanup-users';
import migrationRoutes from './migration.routes';

const router = Router();

// All routes are prefixed with /api (set in server.ts)
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/status', statusRoutes);
router.use('/data', dataRoutes);
router.use('/seed', seedRoutes);
router.use('/test', testUserRoutes);
router.use('/cleanup', cleanupRoutes);
router.use('/migration', migrationRoutes);

export default router;