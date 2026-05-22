import { Pool } from 'pg';
import { env } from '../config/env';

export class SimpleSeedService {
    private pool: Pool;

    constructor() {
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
            console.log(`🔍 Checking table: ${tableName}`);
            const result = await this.pool.query(
                `SELECT COUNT(*) as count FROM ${tableName}`
            );
            console.log(`✅ Table ${tableName} has ${result.rows[0].count} records`);
            return { count: parseInt(result.rows[0].count) };
        } catch (error: any) {
            console.error(`❌ Error checking table ${tableName}:`, error.message);
            return { count: 0 };
        }
    }

    async createDepartment(deptData: { name: string; description?: string; manager_id?: string }) {
        const client = await this.pool.connect();
        try {
            console.log(`📁 Creating department: ${deptData.name}`);

            // Check if it already exists
            const existing = await client.query(
                `SELECT id FROM departments WHERE name = $1`,
                [deptData.name]
            );
            if (existing.rows.length > 0) {
                console.log(`   Department already exists: ${deptData.name} (ID: ${existing.rows[0].id})`);
                return { success: true, id: existing.rows[0].id };
            }

            const result = await client.query(
                `INSERT INTO departments (name, description, manager_id, created_at)
                 VALUES ($1, $2, $3, NOW())
                 RETURNING id`,
                [deptData.name, deptData.description || null, deptData.manager_id || null]
            );
            console.log(`✅ Created department: ${deptData.name} (ID: ${result.rows[0].id})`);
            return { success: true, id: result.rows[0].id };
        } catch (error: any) {
            console.error(`❌ Failed to create department ${deptData.name}:`, error.message);
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async createUser(userData: {
        email: string;
        first_name: string;
        last_name: string;
        role_name: string;
        department_id?: string;
    }) {
        const client = await this.pool.connect();
        try {
            console.log(`👥 Creating user: ${userData.email}`);

            // Check if user already exists
            const existingProfile = await client.query(
                `SELECT id FROM profile WHERE email = $1`,
                [userData.email]
            );

            if (existingProfile.rows.length > 0) {
                const userId = existingProfile.rows[0].id;
                console.log(`✅ User already exists: ${userData.email} (ID: ${userId})`);
                return { success: true, userId };
            }

            await client.query('BEGIN');

            // Generate a UUID for the user
            const userIdResult = await client.query(`SELECT gen_random_uuid() as uuid`);
            const userId = userIdResult.rows[0].uuid;

            // Step 1: Create users_role first (since profile.role_id references users_role.id)
            const roleInsert = await client.query(
                `INSERT INTO users_role (user_id, role_name, created_at)
                 VALUES ($1, $2, NOW())
                 RETURNING id`,
                [userId, userData.role_name]
            );
            const roleId = roleInsert.rows[0].id;

            // Step 2: Create profile with the role_id
            const profileInsert = await client.query(
                `INSERT INTO profile (id, email, first_name, last_name, role_id, department_id, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id`,
                [userId, userData.email, userData.first_name, userData.last_name, roleId, userData.department_id || null]
            );

            await client.query('COMMIT');
            console.log(`✅ Created user: ${userData.email} (ID: ${userId}, Role ID: ${roleId})`);
            
            return { success: true, userId };
        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error(`❌ Failed to create user ${userData.email}:`, error.message);
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async createTask(taskData: {
        title: string;
        description?: string;
        status: string;
        assigned_to?: string;
        created_by: string;
        department_id?: string;
        due_date?: string;
    }) {
        const client = await this.pool.connect();
        try {
            console.log(`📋 Creating task: ${taskData.title}`);
            
            const result = await client.query(
                `INSERT INTO tracker_tasks (title, description, status, assigned_to, created_by, department_id, due_date, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
                 RETURNING id`,
                [taskData.title, taskData.description || null, taskData.status, taskData.assigned_to || null, taskData.created_by, taskData.department_id || null, taskData.due_date || null]
            );
            console.log(`✅ Created task: ${taskData.title} (ID: ${result.rows[0].id})`);
            return { success: true, id: result.rows[0].id };
        } catch (error: any) {
            console.error(`❌ Failed to create task ${taskData.title}:`, error.message);
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async createNotification(notifData: {
        user_id: string;
        title: string;
        message: string;
        type: string;
    }) {
        const client = await this.pool.connect();
        try {
            console.log(`🔔 Creating notification: ${notifData.title}`);
            
            const result = await client.query(
                `INSERT INTO notifications (user_id, title, message, type, created_at) 
                 VALUES ($1, $2, $3, $4, NOW()) 
                 RETURNING id`,
                [notifData.user_id, notifData.title, notifData.message, notifData.type]
            );
            console.log(`✅ Created notification: ${notifData.title} (ID: ${result.rows[0].id})`);
            return { success: true, id: result.rows[0].id };
        } catch (error: any) {
            console.error(`❌ Failed to create notification ${notifData.title}:`, error.message);
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async checkAndCreateSchema() {
        const client = await this.pool.connect();
        try {
            console.log('🔍 Checking database schema...');
            
            // Check if required tables exist
            const requiredTables = ['departments', 'profile', 'users_role', 'tracker_tasks', 'notifications'];
            const existingTables = [];
            
            for (const table of requiredTables) {
                try {
                    await client.query(`SELECT 1 FROM ${table} LIMIT 1`);
                    existingTables.push(table);
                    console.log(`   ✅ Table exists: ${table}`);
                } catch (error: any) {
                    console.log(`   ❌ Table missing: ${table}`);
                }
            }
            
            if (existingTables.length === requiredTables.length) {
                console.log('✅ All required tables exist');
                return { success: true, tablesExist: true };
            } else {
                console.log(`⚠️ Missing ${requiredTables.length - existingTables.length} tables`);
                console.log('💡 Please run the schema creation first using the "Create Schema" button');
                return { success: false, tablesExist: false, missingTables: requiredTables.filter(t => !existingTables.includes(t)) };
            }
        } catch (error: any) {
            console.error('❌ Schema check failed:', error.message);
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async clearAllData() {
        const client = await this.pool.connect();
        try {
            console.log('🧹 Clearing existing seed data...');
            
            // Delete in reverse order of dependencies to avoid foreign key constraints
            const tables = [
                'notifications',
                'tracker_tasks', 
                'users_role',
                'profile',
                'departments'
            ];
            
            // Also clear auth.users if it exists and has seed data
            try {
                const result = await client.query(`DELETE FROM auth.users WHERE email LIKE '%@b1g.com'`);
                if (result.rowCount > 0) {
                    console.log(`   Cleared ${result.rowCount} seed auth.users records`);
                }
            } catch (error: any) {
                console.log(`   Auth.users table not accessible or already clean: ${error.message}`);
            }
            
            for (const table of tables) {
                try {
                    const result = await client.query(`DELETE FROM ${table}`);
                    if (result.rowCount > 0) {
                        console.log(`   Cleared ${result.rowCount} records from ${table}`);
                    }
                } catch (error: any) {
                    console.log(`   Table ${table} might not exist or is already empty: ${error.message}`);
                }
            }
            
            // Reset sequences if they exist
            try {
                await client.query(`ALTER SEQUENCE IF EXISTS departments_id_seq RESTART WITH 1`);
                await client.query(`ALTER SEQUENCE IF EXISTS users_role_id_seq RESTART WITH 1`);
                await client.query(`ALTER SEQUENCE IF EXISTS tracker_tasks_id_seq RESTART WITH 1`);
                await client.query(`ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1`);
            } catch (error: any) {
                console.log(`   Sequence reset not needed: ${error.message}`);
            }
            
            console.log('✅ Data clearing completed');
            return { success: true };
        } catch (error: any) {
            console.error('❌ Failed to clear data:', error.message);
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async close() {
        console.log('🔌 Keeping database pool open for seed operations');
    }
}
