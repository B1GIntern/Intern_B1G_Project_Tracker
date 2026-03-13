import { db } from '../config/db';
import { Notification, SearchResult } from '../models/notification.model';

export const notificationService = {

    // GET /api/notifications
    // Returns all notifications for the logged-in user, newest first
    getNotifications: async (userId: string): Promise<Notification[]> => {
        const result = await db.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    },

    // GET /api/notifications/unread-count
    // Returns count of unread notifications — used for the navbar badge number
    getUnreadCount: async (userId: string): Promise<number> => {
        const result = await db.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
            [userId]
        );
        return parseInt(result.rows[0].count, 10);
    },

    // PATCH /api/notifications/:id/read
    // Marks a single notification as read
    markAsRead: async (id: string): Promise<boolean> => {
        const result = await db.query(
            'UPDATE notifications SET read = true WHERE id = $1',
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    },

    // PATCH /api/notifications/read-all
    // Marks ALL of a user's notifications as read at once
    markAllAsRead: async (userId: string): Promise<boolean> => {
        await db.query(
            'UPDATE notifications SET read = true WHERE user_id = $1',
            [userId]
        );
        return true;
    },

    // DELETE /api/notifications/:id
    // Deletes a single notification
    deleteNotification: async (id: string): Promise<boolean> => {
        const result = await db.query(
            'DELETE FROM notifications WHERE id = $1',
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    },

    // GET /api/notifications/search?q=
    // Searches tasks, users, and departments simultaneously using ILIKE (case-insensitive)
    search: async (query: string): Promise<SearchResult[]> => {
        const q = `%${query}%`;

        const [tasks, users, departments] = await Promise.all([
            db.query(
                `SELECT id, title AS label, status AS sublabel
         FROM tasks WHERE title ILIKE $1 LIMIT 5`,
                [q]
            ),
            db.query(
                `SELECT u.id, p.full_name AS label, p.email AS sublabel
         FROM users u JOIN profiles p ON p.user_id = u.id
         WHERE p.full_name ILIKE $1 OR p.email ILIKE $1 LIMIT 5`,
                [q]
            ),
            db.query(
                `SELECT id, name AS label, description AS sublabel
         FROM departments WHERE name ILIKE $1 LIMIT 5`,
                [q]
            ),
        ]);

        return [
            ...tasks.rows.map((r) => ({ type: 'task' as const, id: r.id, label: r.label, sublabel: r.sublabel })),
            ...users.rows.map((r) => ({ type: 'user' as const, id: r.id, label: r.label, sublabel: r.sublabel })),
            ...departments.rows.map((r) => ({ type: 'department' as const, id: r.id, label: r.label, sublabel: r.sublabel })),
        ];
    },
};