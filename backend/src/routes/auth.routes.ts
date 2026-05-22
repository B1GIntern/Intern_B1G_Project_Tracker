import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// GET  /api/auth/me      → protected, needs valid JWT
// POST /api/auth/login   → public
// POST /api/auth/logout  → public (JWT is stateless, frontend deletes the token)
// POST /api/auth/signup  → public
// POST /api/auth/change-password → protected, needs valid JWT

router.get('/me', requireAuth, authController.getMe);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/signup', authController.signup);
router.post('/change-password', requireAuth, authController.changePassword);

export default router;