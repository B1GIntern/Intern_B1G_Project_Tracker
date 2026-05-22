import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Dashboard stats — all logged-in roles can view
// GET /api/dashboard/stats
// Note: this route is under departmentRoutes but registered separately in index.ts
router.get('/dashboard/stats', requireAuth, departmentController.getDashboardStats);

// GET /api/departments → all logged-in roles can view
router.get('/', requireAuth, departmentController.getAllDepartments);

// Department management — admin only
// POST   /api/departments
// PUT    /api/departments/:id
// DELETE /api/departments/:id
router.post('/', requireAuth, requireRole('admin'), departmentController.createDepartment);
router.put('/:id', requireAuth, requireRole('admin'), departmentController.updateDepartment);
router.delete('/:id', requireAuth, requireRole('admin'), departmentController.deleteDepartment);

export default router;