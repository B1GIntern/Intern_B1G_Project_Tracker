import { db, isSupabase } from '../config/db';

import { Task, TaskAttachment, CreateTaskBody, UpdateTaskBody } from '../models/task.model';

import { DisplayUser } from '../models/user.model';

import { Department } from '../models/department.model';

export const taskService = {

    // GET /api/tasks/tracker

    // Returns Kanban board data scoped by role:

    //   admin   → ALL tasks, ALL profiles, ALL departments

    //   manager → tasks in their department only

    //   user    → tasks assigned to them only

    getTracker: async (

        userId: string,

        role: string

    ): Promise<{ tasks: Task[]; profiles: DisplayUser[]; departments: Department[] }> => {

        let tasksResult;

        console.log('Fetching tracker data for:', { userId, role });

        if (role === 'admin') {

            console.log('Admin role - fetching all tasks');

            tasksResult = await db.query(

                'SELECT * FROM tracker_tasks ORDER BY created_at DESC'

            );

        } else if (role === 'manager') {

            console.log('Manager role - fetching tasks for user:', userId);

            // Get manager's department first

            const deptResult = await db.query(

                'SELECT department_id FROM profile WHERE id = $1 LIMIT 1',

                [userId]

            );

            const managerDeptId = deptResult.rows[0]?.department_id;

            console.log('Manager department ID:', managerDeptId);

            if (!managerDeptId) {

                console.log('Manager has no department, returning empty tasks');

                tasksResult = { rows: [] };

            } else {

                // Get team member IDs: manager themselves + employees in their department

                const teamResult = await db.query(

                    `SELECT p.id FROM profile p

                     JOIN users_role ur ON ur.user_id = p.id

                     WHERE p.department_id = $1 

                       AND (p.id = $2 OR ur.role_name = 'employee')`,

                    [managerDeptId, userId]

                );

                const teamMemberIds = teamResult.rows.map(r => r.id);

                console.log('Team member IDs (manager + employees only):', teamMemberIds);

                if (teamMemberIds.length === 0) {

                    tasksResult = { rows: [] };

                } else {

                    // Get tasks where assigned_to OR created_by is the manager or an employee

                    const placeholders1 = teamMemberIds.map((_, i) => `$${i + 1}`).join(',');

                    const placeholders2 = teamMemberIds.map((_, i) => `$${i + 1 + teamMemberIds.length}`).join(',');

                    tasksResult = await db.query(

                        `SELECT t.* FROM tracker_tasks t

                         WHERE t.assigned_to IN (${placeholders1})

                            OR t.created_by IN (${placeholders2})

                         ORDER BY t.created_at DESC`,

                        [...teamMemberIds, ...teamMemberIds]

                    );

                    console.log('Manager team tasks query executed, rows:', tasksResult.rows.length);

                }

            }

        } else {

            console.log('User role - fetching assigned tasks for:', userId);

            tasksResult = await db.query(

                'SELECT * FROM tracker_tasks WHERE assigned_to = $1 ORDER BY created_at DESC',

                [userId]

            );

        }

        const [profilesResult, deptsResult] = await Promise.all([

            db.query(

                `SELECT p.id AS user_id, p.first_name || ' ' || p.last_name AS full_name, p.email,

                ur.role_name AS role, d.id AS department_id, d.name AS department_name

                FROM profile p

                JOIN users_role ur ON ur.user_id = p.id

                LEFT JOIN departments d ON d.id = p.department_id`

            ),

            db.query('SELECT * FROM departments ORDER BY name ASC'),

        ]);

        return {

            tasks: tasksResult.rows,

            profiles: profilesResult.rows,

            departments: deptsResult.rows,

        };

    },

    // GET /api/tasks

    // Returns tasks based on role:

    //   admin   → ALL tasks

    //   manager → tasks in their department only

    //   employee → tasks assigned to them only

    getAllTasks: async (userId: string, role: string): Promise<Task[]> => {

        let result;

        if (role === 'admin') {

            result = await db.query(

                'SELECT * FROM tracker_tasks ORDER BY created_at DESC'

            );

        } else if (role === 'manager') {

            // Get manager's department

            const deptResult = await db.query(

                'SELECT department_id FROM profile WHERE id = $1 LIMIT 1',

                [userId]

            );

            const managerDeptId = deptResult.rows[0]?.department_id;

            if (!managerDeptId) {

                return [];

            }

            // Get tasks where assigned_to is in the same department

            result = await db.query(

                'SELECT * FROM tracker_tasks WHERE assigned_to = $1 ORDER BY created_at DESC',

                [userId]

            );

        } else {
            // Employee role - fetch tasks assigned to them only
            result = await db.query(
                'SELECT * FROM tracker_tasks WHERE assigned_to = $1 ORDER BY created_at DESC',
                [userId]
            );
        }

        return result.rows;

    },

    // GET /api/tasks/:id

    // Returns a single task by ID

    getTaskById: async (id: string): Promise<Task | null> => {

        const result = await db.query(

            'SELECT * FROM tracker_tasks WHERE id = $1',

            [id]

        );

        return result.rows[0] ?? null;

    },

    // POST /api/tasks

    // Creates a new task. If assigned_to is set, auto-creates a

    // 'task_assigned' notification for that user and notifies Manager/Admin in same department.

    createTask: async (body: CreateTaskBody, createdBy: string): Promise<Task> => {

        const client = await db.connect();

        try {

            await client.query('BEGIN');

            const result = await client.query(

                `INSERT INTO tracker_tasks

          (title, description, status, due_date, assigned_to, created_by, department_id)

         VALUES ($1, $2, $3, $4, $5, $6, $7)

         RETURNING *`,

                [

                    body.title,

                    body.description ?? null,

                    body.status ?? null,

                    body.due_date ?? null,

                    body.assigned_to ?? null,

                    createdBy,

                    body.department_id ?? null,

                ]

            );

            const task: Task = result.rows[0];

            // Auto-create notification for the assigned user

            if (task.assigned_to) {

                // Get the creator's name (who assigned the task)

                const creatorResult = await client.query(

                    `SELECT first_name || ' ' || last_name as full_name FROM profile WHERE id = $1`,

                    [createdBy]

                );

                const creatorName = creatorResult.rows[0]?.full_name || 'Someone';

                await client.query(

                    `INSERT INTO notifications (user_id, title, message, type, task_id)

           VALUES ($1, $2, $3, $4, $5)`,

                    [

                        task.assigned_to,

                        'New Task Assigned',

                        `${creatorName} has assigned a new task: "${task.title}"`,

                        'task_assigned',

                        task.id,

                    ]

                );

            }

            // Create 'New Task Created' notification for Admin users only

            if (task.assigned_to && task.department_id) {

                // Get the creator's name

                const creatorResult = await client.query(

                    `SELECT first_name || ' ' || last_name as full_name FROM profile WHERE id = $1`,

                    [createdBy]

                );

                const creatorName = creatorResult.rows[0]?.full_name || 'Someone';

                // Get assigned user name

                const assigneeResult = await client.query(

                    `SELECT first_name || ' ' || last_name as full_name FROM profile WHERE id = $1`,

                    [task.assigned_to]

                );

                const assignedToName = assigneeResult.rows[0]?.full_name || 'someone';

                // Get Admin users ONLY (not managers) in the same department, EXCLUDE the creator

                const adminResult = await client.query(

                    `SELECT DISTINCT p.id as user_id 

                     FROM profile p 

                     JOIN users_role ur ON ur.user_id = p.id 

                     WHERE LOWER(ur.role_name) = 'admin' 

                       AND p.department_id = $1

                       AND p.id != $2`,

                    [task.department_id, createdBy]

                );

                const notificationTitle = 'New Task Created';

                const notificationMessage = `${creatorName} created a new task "${task.title}" and assigned it to ${assignedToName}`;

                // Create notification for each Admin in the department

                for (const admin of adminResult.rows) {

                    await client.query(

                        `INSERT INTO notifications (user_id, title, message, type, task_id)

                         VALUES ($1, $2, $3, $4, $5)`,

                        [

                            admin.user_id,

                            notificationTitle,

                            notificationMessage,

                            'task_assigned',

                            task.id

                        ]

                    );

                }

                console.log(`Created ${adminResult.rows.length} notifications for Admin(s) about new task`);

            }

            await client.query('COMMIT');

            return task;

        } catch (err) {

            await client.query('ROLLBACK');

            throw err;

        } finally {

            client.release();

        }

    },

    // PUT /api/tasks/:id

    // Updates only the fields provided in body.

    // Also used for drag-drop status change on the Kanban board.

    updateTask: async (id: string, body: UpdateTaskBody): Promise<Task | null> => {

        const fields: string[] = [];

        const values: unknown[] = [];

        let idx = 1;

        if (body.title !== undefined) { fields.push(`title = $${idx++}`); values.push(body.title); }

        if (body.description !== undefined) { fields.push(`description = $${idx++}`); values.push(body.description); }

        if (body.status !== undefined) { fields.push(`status = $${idx++}`); values.push(body.status); }

        if (body.due_date !== undefined) { fields.push(`due_date = $${idx++}`); values.push(body.due_date); }

        if (body.assigned_to !== undefined) { fields.push(`assigned_to = $${idx++}`); values.push(body.assigned_to); }

        if (body.department_id !== undefined) { fields.push(`department_id = $${idx++}`); values.push(body.department_id); }

        if (fields.length === 0) return null;

        values.push(id);

        const result = await db.query(

            `UPDATE tracker_tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,

            values

        );

        return result.rows[0] ?? null;

    },

    // DELETE /api/tasks/:id

    // Deletes a task. DB cascades to task_attachments and notifications automatically.

    deleteTask: async (id: string): Promise<boolean> => {

        const result = await db.query('DELETE FROM tracker_tasks WHERE id = $1', [id]);

        return (result.rowCount ?? 0) > 0;

    },

    // GET /api/tasks/:id/attachments

    // Returns all file attachments linked to a task

    getAttachments: async (taskId: string): Promise<TaskAttachment[]> => {

        const result = await db.query(

            'SELECT * FROM task_attachments WHERE task_id = $1 ORDER BY created_at DESC',

            [taskId]

        );

        return result.rows;

    },

    // POST /api/tasks/:id/attachments

    // Saves the uploaded file metadata to the DB after Multer stores the file on disk

    addAttachment: async (

        taskId: string,

        uploadedBy: string,

        file: { filename: string; originalname: string; mimetype: string; size: number }

    ): Promise<TaskAttachment> => {

        const fileUrl = `/uploads/task-attachments/${file.filename}`;

        const result = await db.query(

            `INSERT INTO task_attachments (task_id, file_name, file_url, file_type, file_size, uploaded_by)

       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,

            [taskId, file.originalname, fileUrl, file.mimetype, file.size, uploadedBy]

        );

        return result.rows[0];

    },

    // DELETE /api/tasks/:id/attachments/:attId

    // Deletes an attachment record from the DB

    deleteAttachment: async (attId: string): Promise<boolean> => {

        const result = await db.query(

            'DELETE FROM task_attachments WHERE id = $1',

            [attId]

        );

        return (result.rowCount ?? 0) > 0;

    },

};