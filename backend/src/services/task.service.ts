import { db } from '../config/db';
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

        if (role === 'admin') {
            tasksResult = await db.query(
                'SELECT * FROM tasks ORDER BY created_at DESC'
            );
        } else if (role === 'manager') {
            tasksResult = await db.query(
                `SELECT t.* FROM tasks t
         JOIN user_departments ud ON ud.department_id = t.department_id
         WHERE ud.user_id = $1
         ORDER BY t.created_at DESC`,
                [userId]
            );
        } else {
            tasksResult = await db.query(
                'SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY created_at DESC',
                [userId]
            );
        }

        const [profilesResult, deptsResult] = await Promise.all([
            db.query(
                `SELECT u.id AS user_id, p.full_name, p.email, p.avatar_url,
                ur.role, ud.department_id, d.name AS department_name
         FROM users u
         JOIN profiles p ON p.user_id = u.id
         JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN user_departments ud ON ud.user_id = u.id
         LEFT JOIN departments d ON d.id = ud.department_id`
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
    // Returns all tasks ordered by newest first
    getAllTasks: async (): Promise<Task[]> => {
        const result = await db.query(
            'SELECT * FROM tasks ORDER BY created_at DESC'
        );
        return result.rows;
    },

    // POST /api/tasks
    // Creates a new task. If assigned_to is set, auto-creates a
    // 'task_assigned' notification for that user.
    createTask: async (body: CreateTaskBody, createdBy: string): Promise<Task> => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                `INSERT INTO tasks
          (title, description, status, progress, due_date, assigned_to, created_by, department_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
                [
                    body.title,
                    body.description ?? null,
                    body.status ?? 'todo',
                    body.progress ?? 0,
                    body.due_date ?? null,
                    body.assigned_to ?? null,
                    createdBy,
                    body.department_id ?? null,
                ]
            );

            const task: Task = result.rows[0];

            // Auto-create notification for the assigned user
            if (task.assigned_to) {
                await client.query(
                    `INSERT INTO notifications (user_id, title, message, type, task_id)
           VALUES ($1, 'New Task Assigned', $2, 'task_assigned', $3)`,
                    [
                        task.assigned_to,
                        `You have been assigned a new task: "${task.title}"`,
                        task.id,
                    ]
                );
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
        if (body.progress !== undefined) { fields.push(`progress = $${idx++}`); values.push(body.progress); }
        if (body.due_date !== undefined) { fields.push(`due_date = $${idx++}`); values.push(body.due_date); }
        if (body.assigned_to !== undefined) { fields.push(`assigned_to = $${idx++}`); values.push(body.assigned_to); }
        if (body.department_id !== undefined) { fields.push(`department_id = $${idx++}`); values.push(body.department_id); }

        if (fields.length === 0) return null;

        values.push(id);
        const result = await db.query(
            `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0] ?? null;
    },

    // DELETE /api/tasks/:id
    // Deletes a task. DB cascades to task_attachments and notifications automatically.
    deleteTask: async (id: string): Promise<boolean> => {
        const result = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
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