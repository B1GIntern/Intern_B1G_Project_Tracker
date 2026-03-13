import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response';
import { isValidUUID } from '../utils/validators';

export const notificationController = {

    getNotifications: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const notifications = await notificationService.getNotifications(userId);
            sendSuccess(res, notifications);
        } catch {
            sendError(res, 'Failed to fetch notifications', 500);
        }
    },

    getUnreadCount: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const count = await notificationService.getUnreadCount(userId);
            sendSuccess(res, { count });
        } catch {
            sendError(res, 'Failed to fetch unread count', 500);
        }
    },

    markAsRead: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = String(req.params.id);
            if (!isValidUUID(id)) { sendError(res, 'Invalid notification ID'); return; }

            const updated = await notificationService.markAsRead(id);
            if (!updated) { sendError(res, 'Notification not found', 404); return; }
            sendSuccess(res, { message: 'Marked as read' });
        } catch {
            sendError(res, 'Failed to mark notification as read', 500);
        }
    },

    markAllAsRead: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;
            await notificationService.markAllAsRead(userId);
            sendSuccess(res, { message: 'All notifications marked as read' });
        } catch {
            sendError(res, 'Failed to mark all as read', 500);
        }
    },

    deleteNotification: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = String(req.params.id);
            if (!isValidUUID(id)) { sendError(res, 'Invalid notification ID'); return; }

            const deleted = await notificationService.deleteNotification(id);
            if (!deleted) { sendError(res, 'Notification not found', 404); return; }
            sendSuccess(res, { message: 'Notification deleted' });
        } catch {
            sendError(res, 'Failed to delete notification', 500);
        }
    },

    search: async (req: Request, res: Response): Promise<void> => {
        try {
            const query = req.query.q as string;
            if (!query || query.trim() === '') { sendSuccess(res, []); return; }
            const results = await notificationService.search(query);
            sendSuccess(res, results);
        } catch {
            sendError(res, 'Search failed', 500);
        }
    },
};