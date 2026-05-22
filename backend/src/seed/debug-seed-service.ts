import { Pool } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export class DebugSeedService {
    private pool: Pool;
    private supabaseAdmin: SupabaseClient;

    constructor() {
        this.pool = new Pool({
            connectionString: env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 20000,
        });

        this.supabaseAdmin = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY
        );
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

    async executeSchema(schemaSQL: string) {
        try {
            console.log('🔧 Executing schema...');

            const statements = schemaSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            let successCount = 0;
            let errorCount = 0;

            for (const statement of statements) {
                try {
                    console.log(`🔧 Executing: ${statement.substring(0, 100)}...`);
                    await this.pool.query(statement);
                    successCount++;
                    console.log(`✅ Success: ${statement.substring(0, 50)}...`);
                } catch (error: any) {
                    errorCount++;
                    console.error(`❌ Failed: ${statement.substring(0, 50)}...`);
                    console.error(`   Error: ${error.message}`);
                    console.error(`   Code: ${error.code}`);
                    console.error(`   Detail: ${error.detail}`);
                    console.error(`   Hint: ${error.hint}`);
                }
            }

            return {
                success: errorCount === 0,
                successCount,
                errorCount,
                message: `Schema executed: ${successCount} successful, ${errorCount} failed`
            };
        } catch (error: any) {
            console.error('❌ Schema execution failed:', error.message);
            return {
                success: false,
                message: `Schema execution failed: ${error.message}`
            };
        }
    }

    async repairExistingProfiles() {
        const client = await this.pool.connect();
        try {
            console.log('🔧 Repairing existing profiles by creating missing auth.users via Admin API...');

            // Find profiles that don't have corresponding auth.users
            const missingAuthUsers = await client.query(
                `SELECT p.id, p.email, p.first_name, p.last_name
                 FROM profile p
                 LEFT JOIN auth.users a ON p.id = a.id
                 WHERE a.id IS NULL`
            );

            console.log(`Found ${missingAuthUsers.rows.length} profiles missing auth.users`);

            let successCount = 0;
            let errorCount = 0;

            for (const profile of missingAuthUsers.rows) {
                try {
                    console.log(`Creating auth user for profile: ${profile.email}`);

                    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
                        email: profile.email,
                        password: 'Password123!',
                        email_confirm: true,
                        user_metadata: {
                            first_name: profile.first_name,
                            last_name: profile.last_name,
                        }
                    });

                    if (error) {
                        console.error(`❌ Failed to create auth user for ${profile.email}:`, error.message);
                        errorCount++;
                        continue;
                    }

                    // If Admin API assigned a different ID, update the profile to match
                    if (data.user.id !== profile.id) {
                        await client.query(
                            `UPDATE profile SET id = $1 WHERE id = $2`,
                            [data.user.id, profile.id]
                        );
                        console.log(`   ⚠️ Profile ID updated to match auth UID for ${profile.email}`);
                    }

                    console.log(`✅ Created auth user for: ${profile.email}`);
                    successCount++;
                } catch (error: any) {
                    console.error(`❌ Failed for ${profile.email}:`, error.message);
                    errorCount++;
                }
            }

            console.log(`🔧 Repair completed: ${successCount} successful, ${errorCount} failed`);
            return { success: errorCount === 0, successCount, errorCount };
        } catch (error: any) {
            console.error('❌ Repair failed:', error.message);
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async createAuthUser(userData: { email: string; password: string; first_name: string; last_name: string }) {
        try {
            console.log(`🔐 Creating auth user via Admin API: ${userData.email}`);

            // Check if auth user already exists
            const { data: listData, error: listError } = await this.supabaseAdmin.auth.admin.listUsers();
            if (listError) {
                console.error(`   Error listing users:`, listError.message);
            }

            const existingUser = listData && 'users' in listData ? 
                (listData as any).users.find((u: any) => u.email === userData.email) : 
                null;
            if (existingUser) {
                console.log(`   Auth user already exists: ${userData.email} (ID: ${existingUser.id})`);
                return { success: true, userId: existingUser.id };
            }

            // Create via Admin API — properly populates auth.users with all required fields
            const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: true,
                user_metadata: {
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                }
            });

            if (error) {
                console.error(`❌ Admin API error for ${userData.email}:`, error.message);
                return { success: false, error: error.message };
            }

            console.log(`✅ Auth user created: ${userData.email} (ID: ${data.user.id})`);
            return { success: true, userId: data.user.id };
        } catch (error: any) {
            console.error(`❌ Failed to create auth user ${userData.email}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async createUser(userData: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        role_name: string;
        department_id?: string;
    }) {
        const client = await this.pool.connect();
        try {
            console.log(`👥 Creating user: ${userData.email}`);

            await client.query('BEGIN');

            // Step 1: Create or retrieve the Supabase auth user
            const authUserResult = await this.createAuthUser(userData);
            if (!authUserResult.success) {
                throw new Error(`Failed to create auth user: ${authUserResult.error}`);
            }

            const userId = authUserResult.userId!;
            console.log(`   Using auth user ID: ${userId}`);

            // Step 2: Upsert profile
            const existingProfile = await client.query(
                `SELECT id FROM profile WHERE id = $1`,
                [userId]
            );

            let profileId: string;
            if (existingProfile.rows.length > 0) {
                profileId = existingProfile.rows[0].id;
                console.log(`   Profile already exists: ${userData.email} (ID: ${profileId})`);
                await client.query(
                    `UPDATE profile SET first_name = $1, last_name = $2, department_id = $3, updated_at = NOW()
                     WHERE id = $4`,
                    [userData.first_name, userData.last_name, userData.department_id || null, profileId]
                );
                console.log(`   Profile updated for: ${userData.email}`);
            } else {
                const profileInsert = await client.query(
                    `INSERT INTO profile (id, email, first_name, last_name, role_id, department_id, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW())
                     RETURNING id`,
                    [userId, userData.email, userData.first_name, userData.last_name, null, userData.department_id || null]
                );
                profileId = profileInsert.rows[0].id;
                console.log(`   Profile created for: ${userData.email} (ID: ${profileId})`);
            }

            // Step 3: Upsert users_role
            const existingRole = await client.query(
                `SELECT id FROM users_role WHERE user_id = $1`,
                [profileId]
            );

            if (existingRole.rows.length === 0) {
                await client.query(
                    `INSERT INTO users_role (user_id, role_name, created_at)
                     VALUES ($1, $2, NOW())`,
                    [profileId, userData.role_name]
                );
                console.log(`   Role assigned: ${userData.role_name} for ${userData.email}`);
            } else {
                console.log(`   Role already exists for: ${userData.email}`);
            }

            await client.query('COMMIT');
            console.log(`✅ User fully created: ${userData.email}`);
            return { success: true, userId };
        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error(`❌ Failed to create user ${userData.email}:`, error.message);
            console.error(`   Error details:`, {
                message: error.message,
                code: error.code,
                detail: error.detail,
                hint: error.hint,
            });
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async createDepartment(deptData: { name: string; description?: string; manager_id?: string }) {
        try {
            console.log(`📁 Creating department: ${deptData.name}`);

            // Check if it already exists
            const existing = await this.pool.query(
                `SELECT id FROM departments WHERE name = $1`,
                [deptData.name]
            );
            if (existing.rows.length > 0) {
                console.log(`   Department already exists: ${deptData.name} (ID: ${existing.rows[0].id})`);
                return { success: true, id: existing.rows[0].id };
            }

            const result = await this.pool.query(
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
        try {
            console.log(`📋 Creating task: ${taskData.title}`);

            const result = await this.pool.query(
                `INSERT INTO tracker_tasks (title, description, status, assigned_to, created_by, department_id, due_date, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                 RETURNING id`,
                [
                    taskData.title,
                    taskData.description || null,
                    taskData.status,
                    taskData.assigned_to || null,
                    taskData.created_by,
                    taskData.department_id || null,
                    taskData.due_date || null,
                ]
            );
            console.log(`✅ Created task: ${taskData.title} (ID: ${result.rows[0].id})`);
            return { success: true, id: result.rows[0].id };
        } catch (error: any) {
            console.error(`❌ Failed to create task ${taskData.title}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async createNotification(notifData: {
        user_id: string;
        title: string;
        message: string;
        type: string;
    }) {
        try {
            console.log(`🔔 Creating notification: ${notifData.title}`);

            const result = await this.pool.query(
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
        }
    }

    async close() {
        console.log('🔌 Keeping database pool open for seed operations');
    }
}