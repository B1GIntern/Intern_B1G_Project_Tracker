import { Pool } from 'pg';
import { env } from '../config/env';

export class DirectSeedService {
    private pool: Pool;

    constructor() {
        // Create direct PostgreSQL connection
        this.pool = new Pool({
            connectionString: env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 20000,
        });
    }

    async checkTableStatus(tableName: string) {
        try {
            const result = await this.pool.query(
                `SELECT COUNT(*) as count FROM ${tableName}`
            );
            return { count: parseInt(result.rows[0].count) };
        } catch (error: any) {
            console.error(`Error checking table ${tableName}:`, error.message);
            return { count: 0 };
        }
    }

    async executeSchema(schemaSQL: string) {
        try {
            console.log('🔧 Executing schema...');
            
            // Split SQL into individual statements
            const statements = schemaSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            let successCount = 0;
            let errorCount = 0;

            for (const statement of statements) {
                try {
                    await this.pool.query(statement);
                    successCount++;
                    console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
                } catch (error: any) {
                    errorCount++;
                    console.error(`❌ Failed: ${statement.substring(0, 50)}... - ${error.message}`);
                }
            }

            return {
                success: true,
                successCount,
                errorCount,
                message: `Schema executed: ${successCount} successful, ${errorCount} failed`
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Schema execution failed: ${error.message}`
            };
        }
    }

    async createUser(userData: { email: string; password: string; first_name: string; last_name: string; role_name: string; department_id?: string }) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Generate a UUID for the user
            const userId = 'gen_random_uuid()';

            // Insert into profile (skip auth.users since we're not using Supabase Auth)
            await client.query(
                `INSERT INTO profile (id, email, first_name, last_name, created_at) 
                 VALUES (${userId}, $1, $2, $3, NOW())`,
                [userId, userData.email, userData.first_name, userData.last_name]
            );

            // Insert role
            await client.query(
                `INSERT INTO users_role (user_id, role_name, created_at) 
                 VALUES ($1, $2, NOW())`,
                [userId, userData.role_name]
            );

            // Add to department if specified
            if (userData.department_id) {
                await client.query(
                    `UPDATE profile SET department_id = $1 WHERE id = $2`,
                    [userData.department_id, userId]
                );
            }

            await client.query('COMMIT');
            console.log(`✅ Created user: ${userData.email}`);
            
            return { success: true, userId };
        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error(`❌ Failed to create user ${userData.email}:`, error.message);
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async createDepartment(deptData: { name: string; description?: string; manager_id?: string }) {
        try {
            const result = await this.pool.query(
                `INSERT INTO departments (name, description, manager_id, created_at) 
                 VALUES ($1, $2, $3, NOW()) 
                 RETURNING id`,
                [deptData.name, deptData.description || null, deptData.manager_id || null]
            );
            console.log(`✅ Created department: ${deptData.name}`);
            return { success: true, id: result.rows[0].id };
        } catch (error: any) {
            console.error(`❌ Failed to create department ${deptData.name}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async createTask(taskData: { title: string; description?: string; status: string; assigned_to?: string; created_by: string; department_id?: string; due_date?: string }) {
        try {
            const result = await this.pool.query(
                `INSERT INTO tracker_tasks (title, description, status, assigned_to, created_by, department_id, due_date, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
                 RETURNING id`,
                [taskData.title, taskData.description || null, taskData.status, taskData.assigned_to || null, taskData.created_by, taskData.department_id || null, taskData.due_date || null]
            );
            console.log(`✅ Created task: ${taskData.title}`);
            return { success: true, id: result.rows[0].id };
        } catch (error: any) {
            console.error(`❌ Failed to create task ${taskData.title}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async createNotification(notifData: { user_id: string; title: string; message: string; type: string }) {
        try {
            const result = await this.pool.query(
                `INSERT INTO notifications (user_id, title, message, type, created_at) 
                 VALUES ($1, $2, $3, $4, NOW()) 
                 RETURNING id`,
                [notifData.user_id, notifData.title, notifData.message, notifData.type]
            );
            console.log(`✅ Created notification: ${notifData.title}`);
            return { success: true, id: result.rows[0].id };
        } catch (error: any) {
            console.error(`❌ Failed to create notification ${notifData.title}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async close() {
        await this.pool.end();
    }
}
