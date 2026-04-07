import { Request, Response } from 'express';

import { taskService } from '../services/task.service';

import { sendSuccess, sendError } from '../utils/response';

import { getMissingField, isValidUUID } from '../utils/validators';

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



        // 1. Notify the assignee (if different from the mover)

        if (task.assigned_to && task.assigned_to !== userId) {

            await db.query(

                `INSERT INTO notifications (user_id, title, message, type, task_id)

                 VALUES ($1, $2, $3, $4, $5)`,

                [

                    task.assigned_to,

                    `Task Completed`,

                    `Your task "${task.title}" has been marked as completed`,

                    'task_completed',

                    task.id

                ]

            );

            console.log('Created notification for assignee:', task.assigned_to);

        }



        // 2. Notify Admin(s) in the same department as the ASSIGNEE (not the mover)
        console.log('DEBUG: task.assigned_to =', task.assigned_to);
        console.log('DEBUG: userId (mover) =', userId);
        
        const assigneeDeptResult = await db.query(
            `SELECT department_id FROM profile WHERE id = $1`,
            [task.assigned_to || userId]
        );
        
        console.log('DEBUG: assigneeDeptResult.rows =', assigneeDeptResult.rows);
        
        const assigneeDeptId = assigneeDeptResult.rows[0]?.department_id;
        console.log('Assignee Dept ID:', assigneeDeptId);

        if (assigneeDeptId) {
            // Get only Admins in the same department as the assignee
            const adminResult = await db.query(
                `SELECT DISTINCT p.id as user_id, p.first_name, p.last_name 
                 FROM profile p 
                 JOIN users_role ur ON ur.user_id = p.id 
                 WHERE LOWER(ur.role_name) = 'admin' 
                   AND p.department_id = $1`,
                [assigneeDeptId]
            );
            
            console.log('DEBUG: Admin query result rows:', adminResult.rows);
            console.log('Admins found:', adminResult.rows.length);

            const notificationTitle = `${assigneeName} completed a task`;
            const notificationMessage = `Task "${task.title}" has been marked as completed by ${assigneeName}`;

            for (const admin of adminResult.rows) {
                console.log('DEBUG: Processing admin:', admin.user_id, admin.first_name, admin.last_name);
                
                // Skip if admin is the one who moved the task
                if (admin.user_id === userId) {
                    console.log('Skipping notification for self (admin):', admin.user_id);
                    continue;
                }

                await db.query(
                    `INSERT INTO notifications (user_id, title, message, type, task_id)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (user_id, task_id, type) DO NOTHING`,
                    [
                        admin.user_id,
                        notificationTitle,
                        notificationMessage,
                        'task_completed',
                        task.id
                    ]
                );
                console.log('Created notification for admin:', admin.user_id);
            }
        } else {
            console.log('DEBUG: No assigneeDeptId found, skipping admin notifications');
        }



        console.log('=== SUCCESS: Created notifications for assignee and admins ===');

    } catch (err) {

        console.error('=== ERROR in createDoneNotifications ===', err);

    }

}



async function createUnderReviewNotifications(task: any, userId: string) {
    try {
        console.log('=== createUnderReviewNotifications START ===');
        console.log('Task:', task.title, 'Assigned to:', task.assigned_to);
        console.log('Mover userId:', userId);

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
            `SELECT DISTINCT p.id as user_id, p.first_name, p.last_name 
             FROM profile p 
             JOIN users_role ur ON ur.user_id = p.id 
             WHERE LOWER(ur.role_name) IN ('manager', 'admin') 
               AND p.department_id = $1`,
            [moverDeptId]
        );
        
        console.log('DEBUG: Admin/Manager query result:', adminManagerResult.rows);
        console.log('Found', adminManagerResult.rows.length, 'managers/admins in dept');

        const notificationTitle = `${assigneeName} task in Under Review`;
        const notificationMessage = `Task "${task.title}" has been moved to Under Review`;

        // Create notification only for Manager(s) and Admin(s) in the same department
        for (const adminManager of adminManagerResult.rows) {
            console.log('DEBUG: Processing admin/manager:', adminManager.user_id, adminManager.first_name, adminManager.last_name);
            
            // Skip creating notification for the user who performed the action
            if (adminManager.user_id === userId) {
                console.log('Skipping notification for self:', adminManager.user_id);
                continue;
            }

            try {
                await db.query(
                    `INSERT INTO notifications (user_id, title, message, type, task_id)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (user_id, task_id, type) DO NOTHING`,
                    [
                        adminManager.user_id,
                        notificationTitle,
                        notificationMessage,
                        'task_completed',
                        task.id
                    ]
                );
                console.log('SUCCESS: Created notification for:', adminManager.user_id);
            } catch (insertErr) {
                console.error('ERROR inserting notification for', adminManager.user_id, ':', insertErr);
            }
        }

        console.log(`Finished creating notifications for ${adminManagerResult.rows.length} Manager(s)/Admin(s)`);

    } catch (err) {
        console.error('Error creating under review notifications:', err);
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



    getAllTasks: async (req: Request, res: Response): Promise<void> => {

        try {

            const { userId, role } = req.user!;

            const tasks = await taskService.getAllTasks(userId, role);

            console.log('Tasks fetched successfully for', role, ':', tasks.length);

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

            console.log('[TaskController] Fetching attachments for task:', id);

            const attachments = await taskService.getAttachments(id);

            console.log('[TaskController] Attachments fetched:', attachments.length);

            // Return array directly for frontend compatibility

            res.status(200).json(attachments);

        } catch (error: any) {

            console.error('[TaskController] Error fetching attachments:', error.message);

            res.status(500).json([]);

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