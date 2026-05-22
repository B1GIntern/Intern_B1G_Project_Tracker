import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { db } from '../config/db';
import { env } from '../config/env';

const router = Router();

// Create Supabase admin client
const supabaseAdmin = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// POST /api/seed/admin - Create admin user
router.post('/admin', async (req, res) => {
    try {
        console.log('🔧 Creating admin user...');

        let userId: string;

        // Check if admin user already exists in auth
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
            console.error('❌ Failed to list users:', listError.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to check existing users',
                error: listError.message
            });
        }

        const existingAdmin = existingUsers.users.find((u: any) => u.email === 'admin@b1g.com');
        
        if (existingAdmin) {
            userId = existingAdmin.id;
            console.log(`✅ Admin user already exists: ${userId}`);
        } else {
            // Create new auth user
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: 'admin@b1g.com',
                password: 'password123',
                email_confirm: true,
                user_metadata: {
                    first_name: 'Super',
                    last_name: 'Admin',
                },
            });

            if (authError) {
                console.error('❌ Auth user creation failed:', authError.message);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to create auth user',
                    error: authError.message
                });
            }

            userId = authData.user.id;
            console.log(`✅ Auth user created: ${userId}`);
        }

        // Create or update profile
        const profileResult = await db.query(
            `INSERT INTO profile (id, email, first_name, last_name) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (id) DO UPDATE SET 
             email = EXCLUDED.email,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name
             RETURNING id`,
            [userId, 'admin@b1g.com', 'Super', 'Admin']
        );

        // Get engineering department
        const deptResult = await db.query(
            'SELECT id FROM departments WHERE name = $1',
            ['Engineering']
        );

        const departmentId = deptResult.rows[0]?.id;

        // Update profile with department
        await db.query(
            'UPDATE profile SET department_id = $1 WHERE id = $2',
            [departmentId, userId]
        );

        // Delete existing role for this user (if any)
        await db.query(
            'DELETE FROM users_role WHERE user_id = $1',
            [userId]
        );

        // Create user role
        await db.query(
            `INSERT INTO users_role (user_id, role_name) 
             VALUES ($1, $2)`,
            [userId, 'admin']
        );

        console.log('✅ Admin user created successfully!');

        res.json({
            success: true,
            message: 'Admin user created successfully',
            user: {
                id: userId,
                email: 'admin@b1g.com',
                role: 'admin',
                department: 'Engineering'
            }
        });

    } catch (error: any) {
        console.error('❌ Seed admin failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin user',
            error: error.message
        });
    }
});

// GET /api/seed/status - Check seed status
router.get('/status', async (req, res) => {
    try {
        const status: any = {};

        // Check profiles
        try {
            const profileResult = await db.query('SELECT COUNT(*) as count FROM profile');
            status.profiles = profileResult.rows[0].count;
        } catch (e) {
            status.profiles = 'Error';
        }

        // Check users_role
        try {
            const roleResult = await db.query('SELECT COUNT(*) as count FROM users_role');
            status.user_roles = roleResult.rows[0].count;
        } catch (e) {
            status.user_roles = 'Error';
        }

        // Check auth users
        try {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers();
            status.auth_users = error ? error.message : data.users.length;
        } catch (e) {
            status.auth_users = 'Error';
        }

        // Check admin specifically
        try {
            const adminResult = await db.query(
                `SELECT p.id, p.email, ur.role_name 
                 FROM profile p 
                 LEFT JOIN users_role ur ON p.id = ur.user_id 
                 WHERE p.email = $1`,
                ['admin@b1g.com']
            );
            status.admin_exists = adminResult.rows.length > 0;
            if (adminResult.rows.length > 0) {
                status.admin_info = adminResult.rows[0];
            }
        } catch (e) {
            status.admin_exists = 'Error';
        }

        res.json({
            success: true,
            status
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to check status',
            error: error.message
        });
    }
});

// POST /api/seed/test-task - Create a test task
router.post('/test-task', async (req, res) => {
    try {
        console.log('🔧 Creating test task...');

        // Get admin user ID
        const adminResult = await db.query(
            `SELECT p.id FROM profile p 
             LEFT JOIN users_role ur ON p.id = ur.user_id 
             WHERE p.email = $1 AND ur.role_name = $2`,
            ['admin@b1g.com', 'admin']
        );

        if (adminResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Admin user not found'
            });
        }

        const adminId = adminResult.rows[0].id;

        // Get any department or use null
        const deptResult = await db.query(
            'SELECT id FROM departments LIMIT 1'
        );

        const deptId = deptResult.rows.length > 0 ? deptResult.rows[0].id : null;

        // Create a test task
        const taskResult = await db.query(
            `INSERT INTO tracker_tasks 
             (title, description, status, assigned_to, created_by, department_id, due_date, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             RETURNING *`,
            [
                'Test3',
                'This is a test task for dashboard verification',
                'todo',
                adminId,
                adminId,
                deptId,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Due in 7 days
            ]
        );

        console.log('✅ Test task created successfully!');

        res.json({
            success: true,
            message: 'Test task created successfully',
            task: taskResult.rows[0]
        });

    } catch (error: any) {
        console.error('❌ Seed test task failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create test task',
            error: error.message
        });
    }
});

// POST /api/seed/demo-data - Create demo tasks for a user by email
router.post('/demo-data', async (req, res) => {
    try {
        const { userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({
                success: false,
                message: 'userEmail is required'
            });
        }

        console.log(`🔧 Creating demo tasks for user: ${userEmail}`);

        // Get user ID by email
        const userResult = await db.query(
            `SELECT p.id, ur.role_name FROM profile p 
             LEFT JOIN users_role ur ON p.id = ur.user_id 
             WHERE p.email = $1`,
            [userEmail]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userId = userResult.rows[0].id;

        // Get first department or create a default one
        let deptResult = await db.query('SELECT id FROM departments LIMIT 1');
        let deptId = deptResult.rows[0]?.id;

        if (!deptId) {
            const newDeptResult = await db.query(
                `INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING id`,
                ['General', 'General department']
            );
            deptId = newDeptResult.rows[0].id;
        }

        // Create multiple demo tasks
        const tasks = [
            {
                title: 'Complete Project Proposal',
                description: 'Draft and finalize the Q2 project proposal',
                status: 'in_progress',
                daysFromNow: 7
            },
            {
                title: 'Review Code Submissions',
                description: 'Review pull requests from team members',
                status: 'todo',
                daysFromNow: 3
            },
            {
                title: 'Update Documentation',
                description: 'Update API documentation for v2.0',
                status: 'completed',
                daysFromNow: -5
            },
            {
                title: 'Client Meeting Preparation',
                description: 'Prepare slides and talking points for client demo',
                status: 'in_progress',
                daysFromNow: 2
            },
            {
                title: 'Performance Optimization',
                description: 'Optimize database queries for better performance',
                status: 'todo',
                daysFromNow: 14
            },
            {
                title: 'Security Audit',
                description: 'Conduct security audit on new features',
                status: 'todo',
                daysFromNow: 5
            }
        ];

        const createdTasks = [];

        for (const task of tasks) {
            const dueDate = new Date(Date.now() + task.daysFromNow * 24 * 60 * 60 * 1000).toISOString();
            
            const taskResult = await db.query(
                `INSERT INTO tracker_tasks 
                 (title, description, status, assigned_to, created_by, department_id, due_date, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                 RETURNING *`,
                [
                    task.title,
                    task.description,
                    task.status,
                    userId,
                    userId,
                    deptId,
                    dueDate
                ]
            );

            createdTasks.push(taskResult.rows[0]);
        }

        console.log(`✅ Demo tasks created successfully! (${createdTasks.length} tasks)`);

        res.json({
            success: true,
            message: `Created ${createdTasks.length} demo tasks successfully`,
            tasks: createdTasks
        });

    } catch (error: any) {
        console.error('❌ Seed demo data failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create demo data',
            error: error.message
        });
    }
});

export default router;
