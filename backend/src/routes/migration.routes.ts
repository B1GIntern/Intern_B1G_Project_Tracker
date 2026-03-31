import { Router } from 'express';
import { db } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import fs from 'fs';
import path from 'path';

const router = Router();

// Run migration to add task_id to notifications table
router.post('/add-task-id-to-notifications', async (req, res) => {
    try {
        console.log('Running migration: add-task-id-to-notifications');
        
        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/add-task-id-to-notifications.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Migration SQL:', migrationSQL);
        
        // Split SQL statements and execute them separately
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
            console.log('Executing statement:', statement);
            await db.query(statement);
        }
        
        console.log('Migration completed successfully');
        
        sendSuccess(res, { 
            message: 'Migration completed: task_id column added to notifications table',
            migration: 'add-task-id-to-notifications'
        });
    } catch (error: any) {
        console.error('Migration failed:', error);
        sendError(res, `Migration failed: ${error.message}`, 500);
    }
});

export default router;
