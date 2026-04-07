import { db } from '../config/db';

export const overdueTaskService = {
    /**
     * Check for overdue tasks and create notifications
     * Runs periodically to find tasks that have passed their due date
     * and haven't had overdue notifications sent yet
     */
    checkAndNotifyOverdueTasks: async (): Promise<void> => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            console.log('[OverdueTaskService] Starting check at:', new Date().toISOString());

            // First check if column exists
            const colCheck = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tracker_tasks' 
                AND column_name = 'overdue_notification_sent'
            `);
            console.log('[OverdueTaskService] Column check:', colCheck.rows);

            // Find overdue tasks that haven't been notified yet
            const overdueTasksResult = await client.query(`
                SELECT 
                    t.id as task_id,
                    t.title,
                    t.due_date,
                    t.assigned_to,
                    t.department_id,
                    t.overdue_notification_sent,
                    p.first_name || ' ' || p.last_name as assignee_name,
                    p.department_id as user_department_id
                FROM tracker_tasks t
                JOIN profile p ON p.id = t.assigned_to
                WHERE t.due_date < NOW()
                  AND t.status != 'completed'
                  AND (t.overdue_notification_sent = false OR t.overdue_notification_sent IS NULL)
            `);

            const overdueTasks = overdueTasksResult.rows;
            console.log(`[OverdueTaskService] Query found ${overdueTasks.length} overdue tasks`);
            console.log('[OverdueTaskService] Tasks:', overdueTasks.map(t => ({ id: t.task_id, title: t.title, due: t.due_date, sent: t.overdue_notification_sent })));

            if (overdueTasks.length === 0) {
                console.log('[OverdueTaskService] No new overdue tasks found');
                await client.query('COMMIT');
                return;
            }

            console.log(`[OverdueTaskService] Processing ${overdueTasks.length} overdue tasks`);

            for (const task of overdueTasks) {
                try {
                    console.log(`[OverdueTaskService] Processing task: ${task.title} (ID: ${task.task_id})`);
                    
                    // Track users we've already notified for this task to prevent duplicates
                    const notifiedUsers = new Set<string>();
                    
                    // 1. Create notification for the task assignee
                    if (!notifiedUsers.has(task.assigned_to)) {
                        // Check if notification already exists for this user/task
                        const existingNotification = await client.query(`
                            SELECT id FROM notifications 
                            WHERE user_id = $1 AND task_id = $2 AND type = 'overdue_task'
                            LIMIT 1
                        `, [task.assigned_to, task.task_id]);
                        
                        if (existingNotification.rows.length === 0) {
                            console.log(`[OverdueTaskService] Creating notification for assignee: ${task.assigned_to}`);
                            await client.query(`
                                INSERT INTO notifications (user_id, title, message, type, task_id, read, created_at)
                                VALUES ($1, $2, $3, $4, $5, false, NOW())
                                ON CONFLICT (user_id, task_id, type) DO NOTHING
                            `, [
                                task.assigned_to,
                                'Overdue Task',
                                `Your task "${task.title}" is now overdue`,
                                'overdue_task',
                                task.task_id
                            ]);
                            console.log(`[OverdueTaskService] Notification created for assignee`);
                        } else {
                            console.log(`[OverdueTaskService] Notification already exists for assignee: ${task.assigned_to}`);
                        }
                        notifiedUsers.add(task.assigned_to);
                    }

                    // 2. Get Manager(s) in the same department
                    const deptId = task.department_id || task.user_department_id;
                    console.log(`[OverdueTaskService] Looking for managers in department: ${deptId}`);
                    
                    const managersResult = await client.query(`
                        SELECT DISTINCT p.id as user_id
                        FROM profile p
                        JOIN users_role ur ON ur.user_id = p.id
                        WHERE LOWER(ur.role_name) = 'manager'
                          AND p.department_id = $1
                          AND p.id != $2
                    `, [deptId, task.assigned_to]);
                    
                    console.log(`[OverdueTaskService] Found ${managersResult.rows.length} managers`);

                    for (const manager of managersResult.rows) {
                        if (notifiedUsers.has(manager.user_id)) {
                            console.log(`[OverdueTaskService] Skipping already notified manager: ${manager.user_id}`);
                            continue;
                        }
                        
                        // Check if notification already exists
                        const existingNotification = await client.query(`
                            SELECT id FROM notifications 
                            WHERE user_id = $1 AND task_id = $2 AND type = 'overdue_task'
                            LIMIT 1
                        `, [manager.user_id, task.task_id]);
                        
                        if (existingNotification.rows.length === 0) {
                            console.log(`[OverdueTaskService] Creating notification for manager: ${manager.user_id}`);
                            await client.query(`
                                INSERT INTO notifications (user_id, title, message, type, task_id, read, created_at)
                                VALUES ($1, $2, $3, $4, $5, false, NOW())
                                ON CONFLICT (user_id, task_id, type) DO NOTHING
                            `, [
                                manager.user_id,
                                'Overdue Task',
                                `The task of ${task.assignee_name} "${task.title}" is now overdue`,
                                'overdue_task',
                                task.task_id
                            ]);
                        } else {
                            console.log(`[OverdueTaskService] Notification already exists for manager: ${manager.user_id}`);
                        }
                        notifiedUsers.add(manager.user_id);
                    }

                    // 3. Get Admin(s)
                    console.log(`[OverdueTaskService] Looking for admins`);
                    const adminsResult = await client.query(`
                        SELECT DISTINCT p.id as user_id
                        FROM profile p
                        JOIN users_role ur ON ur.user_id = p.id
                        WHERE LOWER(ur.role_name) = 'admin'
                          AND p.id != $1
                    `, [task.assigned_to]);
                    
                    console.log(`[OverdueTaskService] Found ${adminsResult.rows.length} admins`);

                    for (const admin of adminsResult.rows) {
                        if (notifiedUsers.has(admin.user_id)) {
                            console.log(`[OverdueTaskService] Skipping already notified admin: ${admin.user_id}`);
                            continue;
                        }
                        
                        // Check if notification already exists
                        const existingNotification = await client.query(`
                            SELECT id FROM notifications 
                            WHERE user_id = $1 AND task_id = $2 AND type = 'overdue_task'
                            LIMIT 1
                        `, [admin.user_id, task.task_id]);
                        
                        if (existingNotification.rows.length === 0) {
                            console.log(`[OverdueTaskService] Creating notification for admin: ${admin.user_id}`);
                            await client.query(`
                                INSERT INTO notifications (user_id, title, message, type, task_id, read, created_at)
                                VALUES ($1, $2, $3, $4, $5, false, NOW())
                                ON CONFLICT (user_id, task_id, type) DO NOTHING
                            `, [
                                admin.user_id,
                                'Overdue Task',
                                `The task of ${task.assignee_name} "${task.title}" is now overdue`,
                                'overdue_task',
                                task.task_id
                            ]);
                        } else {
                            console.log(`[OverdueTaskService] Notification already exists for admin: ${admin.user_id}`);
                        }
                        notifiedUsers.add(admin.user_id);
                    }

                    // Mark task as notified
                    console.log(`[OverdueTaskService] Marking task ${task.task_id} as notified`);
                    await client.query(`
                        UPDATE tracker_tasks 
                        SET overdue_notification_sent = true 
                        WHERE id = $1
                    `, [task.task_id]);

                    console.log(`[OverdueTaskService] ✅ Completed notifications for task: ${task.title}`);
                } catch (taskError: any) {
                    console.error(`[OverdueTaskService] ❌ Error processing task ${task.task_id}:`, taskError.message);
                    // Continue with next task
                }
            }

            await client.query('COMMIT');
            console.log(`[OverdueTaskService] ✅ Successfully processed all overdue tasks`);

        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error('[OverdueTaskService] ❌ Fatal error:', error.message);
            console.error('[OverdueTaskService] Stack:', error.stack);
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Reset notification flag when a task is updated (e.g., due date extended)
     */
    resetOverdueNotification: async (taskId: string): Promise<void> => {
        await db.query(`
            UPDATE tracker_tasks 
            SET overdue_notification_sent = false 
            WHERE id = $1
        `, [taskId]);
    }
};
