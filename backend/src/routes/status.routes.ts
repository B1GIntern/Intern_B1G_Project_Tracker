import { Router } from 'express';
import { getBackendStatus, getDatabaseStatus, getAllStatus } from '../controllers/status.controller';

const router = Router();

// GET /api/status/backend - Check backend status
router.get('/backend', getBackendStatus);

// GET /api/status/database - Check database status
router.get('/database', getDatabaseStatus);

// GET /api/status/all - Get both backend and database status
router.get('/all', getAllStatus);

export default router;
