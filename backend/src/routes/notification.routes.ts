import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All notification routes require a valid JWT
router.use(requireAuth);

// These must be defined BEFORE /:id to avoid route conflicts
// GET   /api/notifications/search?q=
// GET   /api/notifications/unread-count
// PATCH /api/notifications/read-all
router.get('/search', notificationController.search);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);

// Notification CRUD
// GET    /api/notifications
// PATCH  /api/notifications/:id/read
// DELETE /api/notifications/:id
router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;