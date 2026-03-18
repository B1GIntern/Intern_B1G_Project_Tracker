import { Pool } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export class AuthRepairService {
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

    async createMissingAuthUsers() {
        const client = await this.pool.connect();
        try {
            console.log('🔧 Creating missing auth.users for existing profiles...');

            // Find all profiles without a matching auth.users row
            const missing = await client.query(
                `SELECT p.id, p.email, p.first_name, p.last_name
                 FROM profile p
                 LEFT JOIN auth.users a ON p.id = a.id
                 WHERE a.id IS NULL`
            );

            console.log(`Found ${missing.rows.length} profiles missing auth.users`);

            if (missing.rows.length === 0) {
                console.log('✅ All profiles already have corresponding auth.users');
                return { success: true, message: 'No missing auth.users found', count: 0 };
            }

            let successCount = 0;
            let errorCount = 0;

            for (const profile of missing.rows) {
                try {
                    console.log(`Creating auth user for: ${profile.email} (profile ID: ${profile.id})`);

                    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
                        email: profile.email,
                        password: 'Password123!',
                        email_confirm: true,
                        user_metadata: {
                            first_name: profile.first_name,
                            last_name: profile.last_name,
                        },
                    });

                    if (error) {
                        console.error(`❌ Admin API error for ${profile.email}:`, error.message);
                        errorCount++;
                        continue;
                    }

                    // If the Admin API assigned a different UID than the profile's ID,
                    // update the profile row so they stay in sync
                    if (data.user.id !== profile.id) {
                        await client.query(
                            `UPDATE profile SET id = $1 WHERE id = $2`,
                            [data.user.id, profile.id]
                        );
                        console.log(`   ⚠️  Profile ID updated: ${profile.id} → ${data.user.id} for ${profile.email}`);
                    }

                    console.log(`✅ Created auth user for: ${profile.email} (ID: ${data.user.id})`);
                    successCount++;
                } catch (error: any) {
                    console.error(`❌ Unexpected error for ${profile.email}:`, error.message);
                    errorCount++;
                }
            }

            console.log(`🔧 Repair completed: ${successCount} successful, ${errorCount} failed`);
            return {
                success: errorCount === 0,
                successCount,
                errorCount,
                message: `Created ${successCount} auth.users, ${errorCount} failed`,
            };
        } catch (error: any) {
            console.error('❌ Repair failed:', error.message);
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    async getDatabaseStatus() {
        const client = await this.pool.connect();
        try {
            const status: Record<string, any> = {};

            // auth.users count
            try {
                const { data, error } = await this.supabaseAdmin.auth.admin.listUsers();
                status.auth_users = error ? `Error: ${error.message}` : data.users.length;
            } catch (e: any) {
                status.auth_users = `Error: ${e.message}`;
            }

            // profile count
            try {
                const r = await client.query(`SELECT COUNT(*) as count FROM profile`);
                status.profiles = parseInt(r.rows[0].count);
            } catch (e: any) {
                status.profiles = `Error: ${e.message}`;
            }

            // orphaned profiles (profile exists but no auth.users row)
            try {
                const r = await client.query(`
                    SELECT COUNT(*) as count
                    FROM profile p
                    LEFT JOIN auth.users a ON p.id = a.id
                    WHERE a.id IS NULL
                `);
                status.orphaned_profiles = parseInt(r.rows[0].count);
            } catch (e: any) {
                status.orphaned_profiles = `Error: ${e.message}`;
            }

            // departments count
            try {
                const r = await client.query(`SELECT COUNT(*) as count FROM departments`);
                status.departments = parseInt(r.rows[0].count);
            } catch (e: any) {
                status.departments = `Error: ${e.message}`;
            }

            // tasks count
            try {
                const r = await client.query(`SELECT COUNT(*) as count FROM tracker_tasks`);
                status.tasks = parseInt(r.rows[0].count);
            } catch (e: any) {
                status.tasks = `Error: ${e.message}`;
            }

            // notifications count
            try {
                const r = await client.query(`SELECT COUNT(*) as count FROM notifications`);
                status.notifications = parseInt(r.rows[0].count);
            } catch (e: any) {
                status.notifications = `Error: ${e.message}`;
            }

            return status;
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
        console.log('🔌 Auth repair service pool closed');
    }
}