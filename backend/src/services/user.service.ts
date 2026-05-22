import { db } from '../config/db';
import { supabaseAdmin } from '../config/supabase';

export const userService = {
    getAllUsers: async (): Promise<any[]> => {
        const result = await db.query(`
            SELECT 
                p.id as user_id,
                p.first_name,
                p.last_name,
                CONCAT(p.first_name, ' ', p.last_name) as full_name,
                p.email,
                p.department_id,
                d.name as department_name,
                ur.role_name as role,
                p.created_at
            FROM profile p
            LEFT JOIN departments d ON d.id = p.department_id
            LEFT JOIN users_role ur ON ur.user_id = p.id
            ORDER BY p.created_at DESC
        `);
        return result.rows;
    },

    getUserById: async (userId: string): Promise<any | null> => {
        const result = await db.query(`
            SELECT 
                p.id as user_id,
                p.first_name,
                p.last_name,
                CONCAT(p.first_name, ' ', p.last_name) as full_name,
                p.email,
                p.department_id,
                d.name as department_name,
                ur.role_name as role,
                p.created_at
            FROM profile p
            LEFT JOIN departments d ON d.id = p.department_id
            LEFT JOIN users_role ur ON ur.user_id = p.id
            WHERE p.id = $1
        `, [userId]);
        return result.rows[0] || null;
    },

    createUser: async (data: any): Promise<any> => {
        const { full_name, email, password, role, department_id } = data;

        // Split full_name into first_name and last_name for metadata
        const nameParts = full_name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create auth user in Supabase with user metadata for display name
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: full_name,
                first_name: firstName,
                last_name: lastName
            }
        });

        if (authError) throw authError;

        const userId = authUser.user.id;

        // Create profile record with first_name and last_name (no role column)
        await db.query(`
            INSERT INTO profile (id, first_name, last_name, email, department_id)
            VALUES ($1, $2, $3, $4, $5)
        `, [userId, firstName, lastName, email, department_id]);

        // Create user role record
        await db.query(`
            INSERT INTO users_role (user_id, role_name)
            VALUES ($1, $2)
        `, [userId, role]);

        return { user_id: userId, full_name, email, role };
    },

    updateUser: async (userId: string, data: any): Promise<any | null> => {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.full_name) {
            // Split full_name into first_name and last_name
            const nameParts = data.full_name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            fields.push(`first_name = $${paramIndex++}`);
            values.push(firstName);
            fields.push(`last_name = $${paramIndex++}`);
            values.push(lastName);
        }
        if (data.email) {
            fields.push(`email = $${paramIndex++}`);
            values.push(data.email);
        }
        if (data.department_id !== undefined) {
            fields.push(`department_id = $${paramIndex++}`);
            values.push(data.department_id);
        }

        if (fields.length === 0) return null;

        values.push(userId);
        const query = `UPDATE profile SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        
        try {
            const result = await db.query(query, values);
            
            // Update role if changed
            if (data.role) {
                await db.query(`
                    UPDATE users_role SET role_name = $1 WHERE user_id = $2
                `, [data.role, userId]);
            }

            return result.rows[0] || null;
        } catch (error: any) {
            console.error('[UserService] Update user error:', error.message);
            throw error;
        }
    },

    deleteUser: async (userId: string): Promise<boolean> => {
        try {
            console.log('[UserService] Deleting user:', userId);
            
            // First, handle tasks where user is the creator
            // Option 1: Set created_by to NULL for tasks they created
            await db.query(`
                UPDATE tracker_tasks 
                SET created_by = NULL 
                WHERE created_by = $1
            `, [userId]);
            console.log('[UserService] Updated tasks created by user');
            
            // Handle tasks where user is assigned
            // Option 1: Set assigned_to to NULL for tasks assigned to them
            await db.query(`
                UPDATE tracker_tasks 
                SET assigned_to = NULL 
                WHERE assigned_to = $1
            `, [userId]);
            console.log('[UserService] Updated tasks assigned to user');
            
            // Delete user's notifications
            await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
            console.log('[UserService] Deleted user notifications');
            
            // Delete from users_role first
            await db.query('DELETE FROM users_role WHERE user_id = $1', [userId]);
            console.log('[UserService] Deleted from users_role');
            
            // Delete from profile
            const result = await db.query('DELETE FROM profile WHERE id = $1', [userId]);
            console.log('[UserService] Deleted from profile, rowCount:', result.rowCount);
            
            // Delete auth user
            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (error) {
                console.error('[UserService] Error deleting auth user:', error);
            } else {
                console.log('[UserService] Deleted from auth.users');
            }

            return result.rowCount > 0;
        } catch (error: any) {
            console.error('[UserService] Delete user error:', error.message);
            throw error;
        }
    },

    getTeam: async (userId: string, role: string): Promise<any[]> => {
        if (role === 'admin') {
            return await userService.getAllUsers();
        }

        // For managers - get users in same department
        const result = await db.query(`
            SELECT 
                p.id as user_id,
                CONCAT(p.first_name, ' ', p.last_name) as full_name,
                p.email,
                ur.role_name as role,
                d.name as department_name
            FROM profile p
            LEFT JOIN departments d ON d.id = p.department_id
            LEFT JOIN users_role ur ON ur.user_id = p.id
            WHERE p.department_id = (SELECT department_id FROM profile WHERE id = $1)
            AND p.id != $1
        `, [userId]);

        return result.rows;
    },

    updateNotificationPreferences: async (userId: string, preferences: any): Promise<any | null> => {
        // For now, just return the user without updating since column doesn't exist
        const result = await db.query(`
            SELECT * FROM profile WHERE id = $1
        `, [userId]);
        return result.rows[0] || null;
    }
};
