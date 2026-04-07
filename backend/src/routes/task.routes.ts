import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadAttachment } from '../middleware/upload.middleware';

const router = Router();


// All task routes require a valid JWT

router.use(requireAuth);



// GET  /api/tasks/tracker → must be defined BEFORE /:id to avoid route conflict

router.get('/tracker', taskController.getTracker);



// Task CRUD

// GET    /api/tasks

// POST   /api/tasks

// PUT    /api/tasks/:id

// DELETE /api/tasks/:id

router.get('/', taskController.getAllTasks);

router.post('/', taskController.createTask);

router.put('/:id', taskController.updateTask);

router.delete('/:id', taskController.deleteTask);



// Attachments

// GET    /api/tasks/:id/attachments

// POST   /api/tasks/:id/attachments   → multer handles the file upload

// DELETE /api/tasks/:id/attachments/:attId

router.get('/:id/attachments', taskController.getAttachments);

router.post('/:id/attachments', uploadAttachment.single('file'), taskController.addAttachment);

router.delete('/:id/attachments/:attId', taskController.deleteAttachment);

export default router;