import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All user routes require a valid JWT
router.use(requireAuth);

// GET /api/users/team → all logged-in roles can view
// Must be defined BEFORE /:user_id to avoid route conflict
router.get('/team', userController.getTeam);

// PUT /api/users/profile → update own profile (for all authenticated users)
router.put('/profile', userController.updateProfile);

// User management — admin only
// GET    /api/users
// POST   /api/users
// PUT    /api/users/:user_id
// DELETE /api/users/:user_id
router.get('/', requireRole('admin'), userController.getAllUsers);
router.post('/', requireRole('admin'), userController.createUser);
router.put('/:user_id', requireRole('admin'), userController.updateUser);
router.delete('/:user_id', requireRole('admin'), userController.deleteUser);

export default router;