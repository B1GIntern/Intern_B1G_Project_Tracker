import { Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { sendSuccess, sendError } from '../utils/response';
import { getMissingField, isValidUUID, isValidProgress } from '../utils/validators';
import { db } from '../config/db';

async function createDoneNotifications(task: any, userId: string) {
    try {
        console.log('=== createDoneNotifications START ===');
        console.log('Task:', task.title, 'Assigned to:', task.assigned_to);

        // Get the ASSIGNED user's name (not the mover)
        let assigneeName = 'Someone';
        if (task.assigned_to) {
            const assigneeResult = await db.query(
                `SELECT first_name || ' ' || last_name as full_name FROM profile WHERE id = $1`,
                [task.assigned_to]
            );
            if (assigneeResult.rows[0]?.full_name) {
                assigneeName = assigneeResult.rows[0].full_name;
            }
        }
        console.log('Assignee name:', assigneeName);

        // Get the mover's department for filtering
        const moverResult = await db.query(
            `SELECT department_id FROM profile WHERE id = $1`,
            [userId]
        );
        const moverDeptId = moverResult.rows[0]?.department_id;
        console.log('Mover Dept ID:', moverDeptId);

        if (!moverDeptId) {
            console.log('ERROR: User has no department, skipping notifications');
            return;
        }

        // Get Manager(s) and Admin(s) in the same department
        const query = `SELECT DISTINCT p.id as user_id, p.first_name, p.last_name 
             FROM profile p 
             JOIN users_role ur ON ur.user_id = p.id 
             WHERE LOWER(ur.role_name) IN ('manager', 'admin') 
               AND p.department_id = $1`;
        console.log('Executing query:', query, 'with dept:', moverDeptId);
        
        const adminManagerResult = await db.query(query, [moverDeptId]);
        console.log('Query result count:', adminManagerResult.rows.length);
        console.log('Query result rows:', adminManagerResult.rows);

        const notificationTitle = `${assigneeName} is Done with the Task`;
        const notificationMessage = `Task "${task.title}" has been completed by ${assigneeName}`;

        for (const adminManager of adminManagerResult.rows) {
            // Skip creating notification for the user who performed the action
            if (adminManager.user_id === userId) {
                console.log('Skipping notification for self:', adminManager.user_id);
                continue;
            }
            console.log('Creating notification for:', adminManager.user_id);
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type, task_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    adminManager.user_id,
                    notificationTitle,
                    notificationMessage,
                    'task_assigned',
                    task.id
                ]
            );
        }

        console.log(`=== SUCCESS: Created ${adminManagerResult.rows.length} notifications ===`);
    } catch (err) {
        console.error('=== ERROR in createDoneNotifications ===', err);
    }
}

async function createUnderReviewNotifications(task: any, userId: string) {
    try {
        console.log('=== createUnderReviewNotifications START ===');
        console.log('Task:', task.title, 'Assigned to:', task.assigned_to);

        // Get the ASSIGNED user's name (not the mover)
        let assigneeName = 'Someone';
        if (task.assigned_to) {
            const assigneeResult = await db.query(
                `SELECT first_name || ' ' || last_name as full_name FROM profile WHERE id = $1`,
                [task.assigned_to]
            );
            if (assigneeResult.rows[0]?.full_name) {
                assigneeName = assigneeResult.rows[0].full_name;
            }
        }
        console.log('Assignee name:', assigneeName);

        // Get the mover's department for filtering
        const moverResult = await db.query(
            `SELECT department_id FROM profile WHERE id = $1`,
            [userId]
        );
        const moverDeptId = moverResult.rows[0]?.department_id;
        console.log('Mover Dept ID:', moverDeptId);

        if (!moverDeptId) {
            console.log('User has no department, skipping notifications');
            return;
        }

        // Get Manager(s) and Admin(s) in the same department
        const adminManagerResult = await db.query(
            `SELECT DISTINCT p.id as user_id 
             FROM profile p 
             JOIN users_role ur ON ur.user_id = p.id 
             WHERE LOWER(ur.role_name) IN ('manager', 'admin') 
               AND p.department_id = $1`,
            [moverDeptId]
        );

        const notificationTitle = `${assigneeName}'s task is Under Review`;
        const notificationMessage = `Task "${task.title}" has been moved to Under Review`;

        // Create notification only for Manager(s) and Admin(s) in the same department
        for (const adminManager of adminManagerResult.rows) {
            // Skip creating notification for the user who performed the action
            if (adminManager.user_id === userId) {
                console.log('Skipping notification for self:', adminManager.user_id);
                continue;
            }
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type, task_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    adminManager.user_id,
                    notificationTitle,
                    notificationMessage,
                    'task_assigned',
                    task.id
                ]
            );
        }

        console.log(`Created ${adminManagerResult.rows.length} notifications for Manager(s)/Admin(s) in department ${moverDeptId}`);
    } catch (err) {
        console.error('Error creating under review notifications:', err);
        // Don't throw - we don't want to fail the task update if notifications fail
    }
}

export const taskController = {

    getTracker: async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId, role } = req.user!;
            const data = await taskService.getTracker(userId, role);
            sendSuccess(res, data);
        } catch {
            sendError(res, 'Failed to fetch tracker data', 500);
        }
    },

    getAllTasks: async (_req: Request, res: Response): Promise<void> => {
        try {
            const tasks = await taskService.getAllTasks();
            console.log('Tasks fetched successfully:', tasks);
            sendSuccess(res, tasks);
        } catch {
            console.error('Error fetching tasks');
            sendError(res, 'Failed to fetch tasks', 500);
        }
    },

    createTask: async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('Task creation request received:', {
                body: req.body,
                user: req.user,
                headers: req.headers
            });

            const missing = getMissingField(req.body, ['title']);
            if (missing) { 
                console.error('Missing field:', missing);
                sendError(res, `${missing} is required`); 
                return; 
            }

            const userId = req.user!.userId;
            console.log('Creating task for user:', userId);
            
            const task = await taskService.createTask(req.body, userId);
            console.log('Task created successfully in controller:', task);
            
            sendSuccess(res, task, 201);
        } catch (err: any) {
            console.error('Task controller error:', err);
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                detail: err.detail,
                hint: err.hint,
                stack: err.stack
            });
            sendError(res, 'Failed to create task', 500);
        }
    },

    updateTask: async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('Update task request received:', {
                params: req.params,
                body: req.body,
                user: req.user,
                headers: req.headers
            });
            const id = String(req.params.id);
            
            if (!isValidUUID(id)) { 
                console.error('Invalid task ID:', id);
                sendError(res, 'Invalid task ID'); 
                return; 
            }
            if (!isValidUUID(id)) { sendError(res, 'Invalid task ID'); return; }

            const userId = req.user!.userId;
            const oldTask = await taskService.getTaskById?.(id) || null;
            const oldStatus = oldTask?.status;
            
            console.log('Task update - status check:', {
                taskId: id,
                oldStatus: oldStatus,
                newStatus: req.body.status,
                willTriggerDone: req.body.status === 'done' && oldStatus !== 'done',
                willTriggerUnderReview: req.body.status === 'underreview' && oldStatus !== 'underreview'
            });
            
            const task = await taskService.updateTask(id, req.body);
            if (!task) { sendError(res, 'Task not found or nothing to update', 404); return; }
            
            // If status changed to underreview, create notifications
            if (req.body.status === 'underreview' && oldStatus !== 'underreview') {
                await createUnderReviewNotifications(task, userId);
            }
            
            // If status changed to done/completed, create notifications
            if ((req.body.status === 'done' || req.body.status === 'completed') && oldStatus !== 'done' && oldStatus !== 'completed') {
                await createDoneNotifications(task, userId);
            }
            
            sendSuccess(res, task);
        } catch (err: any) {
            console.error('Update task error:', err);
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                detail: err.detail,
                stack: err.stack
            });
            console.error('Request details:', {
                params: req.params,
                body: req.body,
                user: req.user,
                headers: req.headers
            });
            sendError(res, 'Failed to update task', 500);
        }
    },

    deleteTask: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = String(req.params.id);
            if (!isValidUUID(id)) { sendError(res, 'Invalid task ID'); return; }

            const deleted = await taskService.deleteTask(id);
            if (!deleted) { sendError(res, 'Task not found', 404); return; }
            sendSuccess(res, { message: 'Task deleted successfully' });
        } catch {
            sendError(res, 'Failed to delete task', 500);
        }
    },

    getAttachments: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = String(req.params.id);
            const attachments = await taskService.getAttachments(id);
            sendSuccess(res, attachments);
        } catch {
            sendError(res, 'Failed to fetch attachments', 500);
        }
    },

    addAttachment: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) { sendError(res, 'No file uploaded'); return; }
            const id = String(req.params.id);
            const userId = req.user!.userId;
            const attachment = await taskService.addAttachment(id, userId, req.file);
            sendSuccess(res, attachment, 201);
        } catch {
            sendError(res, 'Failed to upload attachment', 500);
        }
    },

    deleteAttachment: async (req: Request, res: Response): Promise<void> => {
        try {
            const attId = String(req.params.attId);
            const deleted = await taskService.deleteAttachment(attId);
            if (!deleted) { sendError(res, 'Attachment not found', 404); return; }
            sendSuccess(res, { message: 'Attachment deleted successfully' });
        } catch {
            sendError(res, 'Failed to delete attachment', 500);
        }
    },
};