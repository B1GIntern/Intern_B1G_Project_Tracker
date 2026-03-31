import bcrypt from 'bcryptjs';
import { db, isSupabase } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { DisplayUser, TeamMember, AppRole } from '../models/user.model';

// Create Supabase admin client for auth operations
const supabaseAdmin = isSupabase ? createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
) : null;

export const userService = {
    getAllUsers: async (): Promise<DisplayUser[]> => {
        const result = await db.query(
            `SELECT
        u.id              AS user_id,
        p.first_name || ' ' || p.last_name as full_name,
        p.email,
        NULL as avatar_url,
        ur.role_name as role,
        p.department_id,
        d.name            AS department_name
      FROM auth.users u
      JOIN profile p             ON p.id = u.id
      LEFT JOIN users_role ur           ON ur.user_id = u.id
      LEFT JOIN departments d      ON d.id = p.department_id
      ORDER BY p.first_name ASC`
        );
        return result.rows;
    },

    createUser: async (data: {
        full_name: string;
        email: string;
        password: string;
        role: AppRole;
        department_id?: string;
    }): Promise<DisplayUser> => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            console.log('Creating user with data:', data);
            console.log('isSupabase:', isSupabase);
            console.log('supabaseAdmin exists:', !!supabaseAdmin);

            // First check if user already exists in auth.users
            const existingAuthUser = await client.query(
                'SELECT id, email FROM auth.users WHERE email = $1',
                [data.email]
            );

            let userId: string;
            if (existingAuthUser.rows.length > 0) {
                // User exists in auth, use existing ID
                userId = existingAuthUser.rows[0].id;
                console.log('User already exists in auth.users with ID:', userId);
                
                // Check if profile already exists
                const existingProfile = await client.query(
                    'SELECT id FROM profile WHERE id = $1',
                    [userId]
                );
                
                if (existingProfile.rows.length > 0) {
                    throw new Error(`User with email "${data.email}" already exists in the system`);
                } else {
                    // User exists in auth but no profile - create profile for existing user
                    console.log('Creating profile for existing auth user...');
                    
                    const [firstName, lastName] = data.full_name.split(' ');
                    
                    // Create profile for existing auth user
                    await client.query(
                        'INSERT INTO profile (id, email, first_name, last_name, department_id) VALUES ($1, $2, $3, $4, $5)',
                        [userId, data.email, firstName, lastName, data.department_id]
                    );
                    console.log('Profile created for existing user');
                    
                    // Assign role
                    await client.query(
                        'INSERT INTO users_role (user_id, role_name) VALUES ($1, $2)',
                        [userId, data.role]
                    );
                    console.log('Role assigned successfully');
                    
                    await client.query('COMMIT');
                    console.log('Transaction committed successfully');
                    
                    let department_name: string | null = null;
                    if (data.department_id) {
                        const deptResult = await db.query(
                            'SELECT name FROM departments WHERE id = $1',
                            [data.department_id]
                        );
                        department_name = deptResult.rows[0]?.name ?? null;
                    }
                    
                    return {
                        user_id: userId,
                        full_name: data.full_name,
                        email: data.email,
                        avatar_url: null,
                        role: data.role,
                        department_id: data.department_id ?? null,
                        department_name,
                    };
                }
            } else {
                // Create new user in Supabase auth
                if (isSupabase && supabaseAdmin) {
                    console.log('Creating user in Supabase auth...');
                    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                        email: data.email,
                        password: data.password,
                        email_confirm: true,
                        user_metadata: {
                            full_name: data.full_name
                        }
                    });

                    console.log('Supabase auth response:', { authData, authError });

                    if (authError || !authData.user) {
                        console.error('Supabase auth error:', authError);
                        throw new Error(authError?.message || 'Failed to create user in authentication system');
                    }
                    userId = authData.user.id;
                    console.log('Supabase user created with ID:', userId);
                } else {
                    console.error('Supabase authentication not available');
                    throw new Error('Supabase authentication not available');
                }
            }

            // Create profile in database
            const [firstName, lastName] = data.full_name.split(' ');
            console.log('Creating profile with:', { userId, email: data.email, firstName, lastName, department_id: data.department_id });
            
            await client.query(
                'INSERT INTO profile (id, email, first_name, last_name, department_id) VALUES ($1, $2, $3, $4, $5)',
                [userId, data.email, firstName, lastName, data.department_id]
            );
            console.log('Profile created successfully');

            // Assign role
            console.log('Assigning role:', data.role, 'to user:', userId);
            await client.query(
                'INSERT INTO users_role (user_id, role_name) VALUES ($1, $2)',
                [userId, data.role]
            );
            console.log('Role assigned successfully');

            await client.query('COMMIT');
            console.log('Transaction committed successfully');

            let department_name: string | null = null;
            if (data.department_id) {
                const deptResult = await db.query(
                    'SELECT name FROM departments WHERE id = $1',
                    [data.department_id]
                );
                department_name = deptResult.rows[0]?.name ?? null;
            }

            return {
                user_id: userId,
                full_name: data.full_name,
                email: data.email,
                avatar_url: null,
                role: data.role,
                department_id: data.department_id ?? null,
                department_name,
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    updateUser: async (
        userId: string,
        data: { full_name?: string; email?: string; role?: AppRole; department_id?: string }
    ): Promise<DisplayUser | null> => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            if (data.full_name) {
                const [firstName, lastName] = data.full_name.split(' ');
                await client.query(
                    'UPDATE profile SET first_name = $1, last_name = $2 WHERE id = $3',
                    [firstName, lastName, userId]
                );
                console.log('Full name update query executed');
            }

            if (data.email) {
                console.log('Updating email for user:', userId, 'to:', data.email);
                await client.query(
                    'UPDATE profile SET email = $1 WHERE id = $2',
                    [data.email, userId]
                );
                console.log('Email update query executed');
            }

            if (data.role) {
                console.log('Updating role for user:', userId, 'to:', data.role);
                await client.query(
                    'UPDATE users_role SET role_name = $1 WHERE user_id = $2',
                    [data.role, userId]
                );
                console.log('Role update query executed');
            }

            if (data.department_id !== undefined) {
                console.log('Updating department for user:', userId, 'to:', data.department_id);
                await client.query(
                    'UPDATE profile SET department_id = $1 WHERE id = $2',
                    [data.department_id, userId]
                );
            }

            await client.query('COMMIT');

            const result = await db.query(
                `SELECT u.id AS user_id, p.first_name || ' ' || p.last_name as full_name, p.email, NULL as avatar_url,
                ur.role_name as role, p.department_id, d.name AS department_name
         FROM auth.users u
         JOIN profile p ON p.id = u.id
         LEFT JOIN users_role ur ON ur.user_id = u.id
         LEFT JOIN departments d ON d.id = p.department_id
         WHERE u.id = $1`,
                [userId]
            );
            console.log('User updated successfully');
            return result.rows[0] ?? null;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    deleteUser: async (userId: string): Promise<boolean> => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            // Delete from profile table first (foreign key reference)
            await client.query('DELETE FROM profile WHERE id = $1', [userId]);
            
            // Delete from auth.users
            const result = await client.query(
                'DELETE FROM auth.users WHERE id = $1',
                [userId]
            );
            
            await client.query('COMMIT');
            return (result.rowCount ?? 0) > 0;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    getTeam: async (userId: string, role: string): Promise<TeamMember[]> => {
        // Get the user's department first
        const userProfile = await db.query(
            'SELECT department_id FROM profile WHERE id = $1',
            [userId]
        );

        if (userProfile.rows.length === 0 || !userProfile.rows[0].department_id) {
            return []; // No department assigned
        }

        const departmentId = userProfile.rows[0].department_id;

        // Get all users in the same department (excluding the current user)
        const result = await db.query(
            `SELECT 
                u.id AS user_id,
                p.first_name || ' ' || p.last_name as full_name,
                p.email,
                NULL as avatar_url,
                ur.role_name as role,
                p.department_id,
                d.name AS department_name
            FROM auth.users u
            JOIN profile p ON p.id = u.id
            LEFT JOIN users_role ur ON ur.user_id = u.id
            LEFT JOIN departments d ON d.id = p.department_id
            WHERE p.department_id = $1 AND u.id != $2
            ORDER BY p.first_name ASC`,
            [departmentId, userId]
        );

        return result.rows;
    },
};