import { db } from '../config/db';

export const dashboardService = {
    // GET /api/data/dashboard/stats
    // Returns dashboard statistics based on user role
    getStats: async (userId: string, role: string): Promise<{
        total: number;
        inProgress: number;
        completed: number;
        departments: number;
        overdue: number;
        underReview: number;
    }> => {
        let statsResult;

        if (role === 'admin') {
            // Admin sees all tasks
            statsResult = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN status = 'review' THEN 1 END) as under_review,
                    COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue
                FROM tracker_tasks
            `);
        } else if (role === 'manager') {
            // Manager sees tasks for team members (manager + employees in department)
            const deptResult = await db.query(
                'SELECT department_id FROM profile WHERE id = $1 LIMIT 1',
                [userId]
            );
            const managerDeptId = deptResult.rows[0]?.department_id;
            
            if (!managerDeptId) {
                statsResult = { rows: [{ 
                    total: 0, in_progress: 0, completed: 0, 
                    under_review: 0, overdue: 0 
                }] };
            } else {
                // Get team member IDs (manager + employees only, exclude other managers/admins)
                const teamResult = await db.query(
                    `SELECT p.id FROM profile p
                     JOIN users_role ur ON ur.user_id = p.id
                     WHERE p.department_id = $1 
                       AND (p.id = $2 OR ur.role_name = 'employee')`,
                    [managerDeptId, userId]
                );
                const teamMemberIds = teamResult.rows.map(r => r.id);
                
                if (teamMemberIds.length === 0) {
                    statsResult = { rows: [{ 
                        total: 0, in_progress: 0, completed: 0, 
                        under_review: 0, overdue: 0 
                    }] };
                } else {
                    const placeholders1 = teamMemberIds.map((_, i) => `$${i + 1}`).join(',');
                    const placeholders2 = teamMemberIds.map((_, i) => `$${i + 1 + teamMemberIds.length}`).join(',');
                    statsResult = await db.query(
                        `SELECT 
                            COUNT(*) as total,
                            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                            COUNT(CASE WHEN status = 'review' THEN 1 END) as under_review,
                            COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue
                        FROM tracker_tasks
                        WHERE assigned_to IN (${placeholders1})
                           OR created_by IN (${placeholders2})`,
                        [...teamMemberIds, ...teamMemberIds]
                    );
                }
            }
        } else {
            // User sees only their assigned tasks
            statsResult = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN status = 'review' THEN 1 END) as under_review,
                    COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue
                FROM tracker_tasks
                WHERE assigned_to = $1
            `, [userId]);
        }

        const departmentsQuery = role === 'admin' ? 
            'SELECT COUNT(*) as count FROM departments' :
            'SELECT COUNT(*) as count FROM departments WHERE id = (SELECT department_id FROM profile WHERE id = $1)';

        const departmentsResult = await db.query(
            departmentsQuery, 
            role === 'admin' ? [] : [userId]
        );

        const stats = statsResult.rows[0];
        const departments = departmentsResult.rows[0];

        return {
            total: parseInt(stats.total) || 0,
            inProgress: parseInt(stats.in_progress) || 0,
            completed: parseInt(stats.completed) || 0,
            departments: parseInt(departments.count) || 0,
            overdue: parseInt(stats.overdue) || 0,
            underReview: parseInt(stats.under_review) || 0
        };
    },

    // GET /api/data/dashboard/chart-data
    // Returns chart data based on user role
    getChartData: async (userId: string, role: string): Promise<{
        deptChart: { name: string; tasks: number }[];
        trendChart: { date: string; completed: number }[];
    }> => {
        let deptChartQuery: string;
        let params: any[] = [];

        if (role === 'admin') {
            deptChartQuery = `
                SELECT d.name, COUNT(t.id) as tasks
                FROM departments d
                LEFT JOIN tracker_tasks t ON d.id = t.department_id
                GROUP BY d.id, d.name
                ORDER BY tasks DESC
            `;
        } else if (role === 'manager') {
            // Manager sees tasks for team members (manager + employees only)
            deptChartQuery = `
                SELECT 
                    CASE 
                        WHEN t.status = 'todo' THEN 'To Do'
                        WHEN t.status = 'in_progress' THEN 'In Progress'
                        WHEN t.status = 'review' THEN 'Review'
                        WHEN t.status = 'completed' THEN 'Done'
                    END as name,
                    COUNT(*) as tasks
                FROM tracker_tasks t
                WHERE t.assigned_to IN (
                    SELECT p.id FROM profile p
                    JOIN users_role ur ON ur.user_id = p.id
                    WHERE p.department_id = (SELECT department_id FROM profile WHERE id = $1 LIMIT 1)
                      AND (p.id = $1 OR ur.role_name = 'employee')
                ) OR t.created_by IN (
                    SELECT p.id FROM profile p
                    JOIN users_role ur ON ur.user_id = p.id
                    WHERE p.department_id = (SELECT department_id FROM profile WHERE id = $1 LIMIT 1)
                      AND (p.id = $1 OR ur.role_name = 'employee')
                )
                GROUP BY t.status
                ORDER BY tasks DESC
            `;
            params = [userId];
        } else {
            deptChartQuery = `
                SELECT 
                    CASE 
                        WHEN t.status = 'todo' THEN 'To Do'
                        WHEN t.status = 'in_progress' THEN 'In Progress'
                        WHEN t.status = 'review' THEN 'Review'
                        WHEN t.status = 'completed' THEN 'Done'
                    END as name,
                    COUNT(*) as tasks
                FROM tracker_tasks t
                WHERE t.assigned_to = $1
                GROUP BY t.status
                ORDER BY tasks DESC
            `;
            params = [userId];
        }

        // Trend chart - last 7 days completed tasks
        const trendQuery = `
            SELECT 
                TO_CHAR(updated_at, 'Dy') as date,
                COUNT(*) as completed
            FROM tracker_tasks 
            WHERE status = 'completed' 
            AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY TO_CHAR(updated_at, 'Dy'), DATE(updated_at)
            ORDER BY DATE(updated_at)
        `;

        const [deptResult, trendResult] = await Promise.all([
            db.query(deptChartQuery, params),
            db.query(trendQuery)
        ]);

        return {
            deptChart: deptResult.rows,
            trendChart: trendResult.rows
        };
    },

    // GET /api/data/dashboard/user-performance
    // Returns user performance metrics for team members
    getUserPerformance: async (userId: string, role: string, queryUserId?: string): Promise<{
        success: boolean;
        data: {
            users: Array<{
                user_id: string;
                full_name: string;
                email: string;
                department_name: string;
                total_tasks: number;
                completed_tasks: number;
                in_progress_tasks: number;
                overdue_tasks: number;
                completion_rate: number;
                avg_progress: number;
            }>;
        };
    }> => {
        let whereClause = '';
        let params: any[] = [];

        if (queryUserId) {
            // Employee requesting their own performance via query parameter
            whereClause = 'WHERE u.id = $1';
            params = [queryUserId];
        } else if (role === 'employee') {
            // Employee accessing their own performance directly
            whereClause = 'WHERE u.id = $1';
            params = [userId];
        } else if (role === 'admin') {
            // Admin sees all users
            whereClause = '';
        } else if (role === 'manager') {
            // Manager sees users in their department
            whereClause = 'WHERE p.department_id = (SELECT department_id FROM profile WHERE id = $1)';
            params = [userId];
        } else {
            // Invalid role
            throw new Error('Access denied');
        }

        // Build the WHERE clause based on role
        let roleFilter = '';
        if (role !== 'admin') {
            // Non-admin users should not see admin users in performance data
            roleFilter = "WHERE (ur.role_name != 'admin' OR ur.role_name IS NULL)";
        } else {
            // Admin can see all users including themselves
            roleFilter = 'WHERE 1=1';
        }

        // SIMPLIFIED QUERY - always return all users for now to debug
        const performanceQuery = `
            SELECT 
                p.id as user_id,
                p.first_name || ' ' || p.last_name as full_name,
                p.email,
                d.name as department_name,
                COUNT(t.id)::integer as total_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::integer as completed_tasks,
                COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END)::integer as in_progress_tasks,
                COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 END)::integer as overdue_tasks,
                CASE 
                    WHEN COUNT(t.id) = 0 THEN 0.00
                    ELSE ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / COUNT(t.id)), 2)
                END::numeric as completion_rate,
                CASE 
                    WHEN COUNT(t.id) = 0 THEN 0.00
                    ELSE ROUND(AVG(t.progress), 2)
                END as avg_progress
            FROM profile p
            LEFT JOIN departments d ON d.id = p.department_id
            LEFT JOIN tracker_tasks t ON p.id = t.assigned_to
            GROUP BY p.id, p.first_name, p.last_name, p.email, d.name
            ORDER BY avg_progress DESC, completion_rate DESC, completed_tasks DESC
        `;

        console.log('[DashboardService] User performance - Role:', role, 'UserId:', userId);
        console.log('[DashboardService] roleFilter:', roleFilter);
        console.log('[DashboardService] whereClause:', whereClause);
        console.log('[DashboardService] params:', params);

        console.log('[DashboardService] User performance - Role:', role, 'UserId:', userId);
        console.log('[DashboardService] roleFilter:', roleFilter);
        console.log('[DashboardService] whereClause:', whereClause);
        console.log('[DashboardService] params:', params);
        console.log('[DashboardService] Full query:', performanceQuery);

        const result = await db.query(performanceQuery);
        console.log('[DashboardService] Query returned', result.rows.length, 'rows');
        console.log('[DashboardService] First row:', result.rows[0]);

        // Also check if users exist at all
        const userCheck = await db.query('SELECT COUNT(*) as count FROM auth.users');
        console.log('[DashboardService] Total users in auth.users:', userCheck.rows[0]?.count);

        const profileCheck = await db.query('SELECT COUNT(*) as count FROM profile');
        console.log('[DashboardService] Total users in profile:', profileCheck.rows[0]?.count);

        return {
            success: true,
            data: {
                users: result.rows
            }
        };
    }
};
