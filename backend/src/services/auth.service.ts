import bcrypt from 'bcryptjs';
import { db, isSupabase } from '../config/db';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { DisplayUser } from '../models/user.model';

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

// Reusable query — fetches full user profile + role + department by userId
const getUserById = async (userId: string): Promise<DisplayUser | null> => {
    const result = await db.query(
        `SELECT
      p.id              AS user_id,
      p.first_name || ' ' || p.last_name as full_name,
      p.email,
      NULL as avatar_url,
      ur.role_name as role,
      p.department_id,
      d.name            AS department_name
    FROM profile p
    LEFT JOIN users_role ur           ON ur.user_id = p.id
    LEFT JOIN departments d      ON d.id = p.department_id
    WHERE p.id = $1`,
        [userId]
    );
    return result.rows[0] ?? null;
};

// For Supabase: fetch user profile from profile table
const getProfileById = async (userId: string): Promise<DisplayUser | null> => {
    const result = await db.query(
        `SELECT
      p.id AS user_id,
      p.first_name || ' ' || p.last_name as full_name,
      p.email,
      NULL as avatar_url,
      ur.role_name as role,
      p.department_id,
      d.name as department_name
    FROM profile p
    LEFT JOIN users_role ur ON ur.user_id = p.id
    LEFT JOIN departments d ON d.id = p.department_id
    WHERE p.id = $1`,
        [userId]
    );
    return result.rows[0] ?? null;
};

export const authService = {

    // GET /api/auth/me
    // Returns the logged-in user's full profile using their userId from the JWT
    getMe: async (userId: string): Promise<DisplayUser | null> => {
        if (isSupabase) {
            return getProfileById(userId);
        }
        return getUserById(userId);
    },

    // POST /api/auth/login
    // Finds user by email, compares bcrypt hashed password, returns user data if valid
    login: async (
        email: string,
        password: string
    ): Promise<DisplayUser | null> => {
        console.log('Login attempt for:', email);
        console.log('isSupabase:', isSupabase);
        console.log('supabaseAdmin exists:', !!supabaseAdmin);
        
        if (isSupabase && supabaseAdmin) {
            console.log('Using Supabase authentication...');
            // Use Supabase authentication
            try {
                // First try to sign in
                const { data, error } = await supabaseAdmin.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    console.log('Supabase auth error:', error.message);
                    // Return null for invalid credentials - DO NOT auto-create users
                    return null;
                }

                if (!data.user) {
                    console.log('No user data available');
                    return null;
                }

                console.log('Supabase auth success, user ID:', data.user.id);
                
                // Check if profile exists, if not create it
                let profile = await getProfileById(data.user.id);
                if (!profile) {
                    console.log('Profile not found, creating one...');
                    // Create profile for Supabase user
                    const client = await db.connect();
                    try {
                        await client.query('BEGIN');
                        
                        // Get user metadata from Supabase
                        const metadata = data.user.user_metadata || {};
                        const firstName = metadata.first_name || 'Unknown';
                        const lastName = metadata.last_name || 'User';
                        
                        // Insert profile
                        await client.query(
                            'INSERT INTO profile (id, email, first_name, last_name) VALUES ($1, $2, $3, $4)',
                            [data.user.id, email, firstName, lastName]
                        );
                        
                        // Assign role from metadata or default to 'employee'
                        const role = metadata.role || 'employee';
                        await client.query(
                            'INSERT INTO users_role (user_id, role_name) VALUES ($1, $2)',
                            [data.user.id, role]
                        );
                        
                        await client.query('COMMIT');
                        console.log('Profile created successfully');
                    } catch (err) {
                        await client.query('ROLLBACK');
                        console.error('Error creating profile:', err);
                    } finally {
                        client.release();
                    }
                    
                    // Try to get profile again
                    profile = await getProfileById(data.user.id);
                }
                
                return profile;
            } catch (error) {
                console.error('Supabase login error:', error);
                return null;
            }
        }

        // Fallback to traditional authentication
        // Step 1: Find user by email in profile table
        const userResult = await db.query(
            'SELECT id FROM profile WHERE email = $1',
            [email]
        );
        if (userResult.rows.length === 0) return null;

        const user = userResult.rows[0];

        // Step 2: For now, skip password validation since we're using Supabase auth
        // Step 3: Return full user profile
        return getUserById(user.id);
    },

    // POST /api/auth/signup
    // Creates a new user with profile and default 'user' role in one DB transaction
    signup: async (
        email: string,
        password: string,
        fullName: string
    ): Promise<DisplayUser> => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Hash password before storing
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert into users table
            const userResult = await client.query(
                'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
                [email, hashedPassword]
            );
            const userId = userResult.rows[0].id;

            // Insert into profiles table
            await client.query(
                'INSERT INTO profiles (user_id, full_name, email) VALUES ($1, $2, $3)',
                [userId, fullName, email]
            );

            // Assign default role
            await client.query(
                "INSERT INTO users_role (user_id, role_name) VALUES ($1, $2)",
                [userId, 'employee']
            );

            await client.query('COMMIT');

            return {
                user_id: userId,
                full_name: fullName,
                email,
                avatar_url: null,
                role: 'employee',
                department_id: null,
                department_name: null,
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // POST /api/auth/change-password
    // Updates the user's password using Supabase admin API
    changePassword: async (
        userId: string,
        newPassword: string
    ): Promise<boolean> => {
        if (!isSupabase || !supabaseAdmin) {
            console.error('Supabase not available for password change');
            return false;
        }

        try {
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: newPassword }
            );

            if (error) {
                console.error('Supabase password update error:', error.message);
                return false;
            }

            console.log('Password updated successfully for user:', userId);
            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            return false;
        }
    },
};