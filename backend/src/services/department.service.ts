import { db } from '../config/db';
import { Department, DepartmentStats, CreateDepartmentBody, UpdateDepartmentBody } from '../models/department.model';

export const departmentService = {

    // GET /api/departments
    // Returns all departments ordered alphabetically
    getAllDepartments: async (): Promise<Department[]> => {
        const result = await db.query(
            'SELECT * FROM departments ORDER BY name ASC'
        );
        return result.rows;
    },

    // GET /api/dashboard/stats
    // Returns overall task summary stats + per-department breakdown + 14-day trend chart
    // Scoped by role:
    //   admin   → ALL departments and ALL tasks
    //   manager → only their department's tasks
    //   user    → only their assigned tasks
    getDashboardStats: async (userId: string, role: string) => {
        let totalQuery: string;
        let params: string[] = [];

        if (role === 'admin') {
            totalQuery = `
        SELECT
          COUNT(*)                                                    AS total,
          COUNT(*) FILTER (WHERE status = 'in_progress')             AS in_progress,
          COUNT(*) FILTER (WHERE status = 'completed')               AS completed,
          COUNT(*) FILTER (WHERE status = 'under_review')            AS under_review,
          COUNT(*) FILTER (WHERE due_date < NOW()
            AND status NOT IN ('completed', 'approved'))              AS overdue
        FROM tasks`;
        } else if (role === 'manager') {
            totalQuery = `
        SELECT
          COUNT(*)                                                    AS total,
          COUNT(*) FILTER (WHERE t.status = 'in_progress')           AS in_progress,
          COUNT(*) FILTER (WHERE t.status = 'completed')             AS completed,
          COUNT(*) FILTER (WHERE t.status = 'under_review')          AS under_review,
          COUNT(*) FILTER (WHERE t.due_date < NOW()
            AND t.status NOT IN ('completed', 'approved'))            AS overdue
        FROM tasks t
        JOIN user_departments ud ON ud.department_id = t.department_id
        WHERE ud.user_id = $1`;
            params = [userId];
        } else {
            totalQuery = `
        SELECT
          COUNT(*)                                                    AS total,
          COUNT(*) FILTER (WHERE status = 'in_progress')             AS in_progress,
          COUNT(*) FILTER (WHERE status = 'completed')               AS completed,
          COUNT(*) FILTER (WHERE status = 'under_review')            AS under_review,
          COUNT(*) FILTER (WHERE due_date < NOW()
            AND status NOT IN ('completed', 'approved'))              AS overdue
        FROM tasks
        WHERE assigned_to = $1`;
            params = [userId];
        }

        const statsResult = await db.query(totalQuery, params);
        const stats = statsResult.rows[0];

        // Per-department breakdown — admin sees ALL departments
        const deptStatsResult = await db.query(
            `SELECT
        d.id                                                          AS department_id,
        d.name                                                        AS department_name,
        COUNT(t.id)                                                   AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'completed')            AS completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'in_progress')          AS in_progress_tasks,
        COUNT(t.id) FILTER (WHERE t.due_date < NOW()
          AND t.status NOT IN ('completed','approved'))               AS overdue_tasks
      FROM departments d
      LEFT JOIN tasks t ON t.department_id = d.id
      GROUP BY d.id, d.name
      ORDER BY d.name ASC`
        );

        // Trend chart — completed tasks per day for last 14 days
        const trendResult = await db.query(
            `SELECT
        DATE(updated_at) AS date,
        COUNT(*)         AS completed
       FROM tasks
       WHERE status = 'completed'
         AND updated_at >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(updated_at)
       ORDER BY date ASC`
        );

        return {
            stats: {
                total: parseInt(stats.total, 10),
                in_progress: parseInt(stats.in_progress, 10),
                completed: parseInt(stats.completed, 10),
                under_review: parseInt(stats.under_review, 10),
                overdue: parseInt(stats.overdue, 10),
            },
            deptChart: deptStatsResult.rows as DepartmentStats[],
            trendChart: trendResult.rows,
        };
    },

    // POST /api/departments
    // Admin creates a new department
    createDepartment: async (body: CreateDepartmentBody): Promise<Department> => {
        const result = await db.query(
            'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
            [body.name, body.description ?? null]
        );
        return result.rows[0];
    },

    // PUT /api/departments/:id
    // Admin updates a department's name or description
    updateDepartment: async (
        id: string,
        body: UpdateDepartmentBody
    ): Promise<Department | null> => {
        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        if (body.name !== undefined) { fields.push(`name = $${idx++}`); values.push(body.name); }
        if (body.description !== undefined) { fields.push(`description = $${idx++}`); values.push(body.description); }

        if (fields.length === 0) return null;

        values.push(id);
        const result = await db.query(
            `UPDATE departments SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0] ?? null;
    },

    // DELETE /api/departments/:id
    // Admin deletes a department
    deleteDepartment: async (id: string): Promise<boolean> => {
        const result = await db.query(
            'DELETE FROM departments WHERE id = $1',
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    },
};