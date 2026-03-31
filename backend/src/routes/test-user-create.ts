import { Router } from 'express';
import { db } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Test endpoint to create user without Supabase
router.post('/test-create', async (req, res) => {
  try {
    console.log('Test user creation request:', req.body);
    
    const { full_name, email, password, role, department_id } = req.body;
    
    // Generate UUID for user
    const userId = uuidv4();
    
    // Create profile directly in database (bypass Supabase)
    await db.query(`
      INSERT INTO profile (id, email, first_name, last_name, department_id) 
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, email, full_name.split(' ')[0], full_name.split(' ')[1] || '', department_id]);
    
    // Assign role
    await db.query(`
      INSERT INTO users_role (user_id, role_name) 
      VALUES ($1, $2)
    `, [userId, role]);
    
    console.log('Test user created successfully');
    
    res.json({
      success: true,
      message: 'Test user created successfully',
      data: {
        user_id: userId,
        full_name,
        email,
        role,
        department_id
      }
    });
  } catch (error: any) {
    console.error('Test user creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create test user'
    });
  }
});

export default router;
