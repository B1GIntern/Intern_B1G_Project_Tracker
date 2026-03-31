import { Router } from 'express';
import { db } from '../config/db';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// GET /api/data/users - Get all users (no auth for development)
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.full_name,
        u.role,
        d.name as department_name,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// GET /api/data/departments - Get all departments
router.get('/departments', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        created_at,
        updated_at
      FROM departments
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
});

// GET /api/data/tasks - Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.created_at,
        t.updated_at,
        creator.full_name as created_by_name,
        assignee.full_name as assigned_to_name,
        d.name as department_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN departments d ON t.department_id = d.id
      ORDER BY t.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// GET /api/data/notifications - Get all notifications
router.get('/notifications', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.created_at,
        u.full_name as user_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Dashboard routes - re-enable authentication
router.use(requireAuth);

// GET /api/data/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', dashboardController.getStats);

// GET /api/data/dashboard/chart-data - Get dashboard chart data
router.get('/dashboard/chart-data', dashboardController.getChartData);

// GET /api/data/dashboard/user-performance - Get user performance data
router.get('/dashboard/user-performance', dashboardController.getUserPerformance);

// TEST: Check user role
router.get('/test-user-role/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await db.query(`
      SELECT ur.role_name 
      FROM users_role ur
      JOIN profile p ON p.id = ur.user_id 
      WHERE p.email = $1
    `, [email]);
    
    res.json({
      success: true,
      email,
      role: result.rows[0]?.role_name || 'No role found'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
