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
      u.id              AS user_id,
      p.full_name,
      p.email,
      p.avatar_url,
      ur.role,
      ud.department_id,
      d.name            AS department_name
    FROM users u
    JOIN profiles p             ON p.user_id = u.id
    JOIN user_roles ur           ON ur.user_id = u.id
    LEFT JOIN user_departments ud ON ud.user_id = u.id
    LEFT JOIN departments d      ON d.id = ud.department_id
    WHERE u.id = $1`,
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
        if (isSupabase && supabaseAdmin) {
            // Use Supabase authentication
            try {
                const { data, error } = await supabaseAdmin.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error || !data.user) {
                    console.log('Supabase auth error:', error?.message);
                    return null;
                }

                // Return user profile from our database
                return getProfileById(data.user.id);
            } catch (error) {
                console.error('Supabase login error:', error);
                return null;
            }
        }

        // Fallback to traditional authentication
        // Step 1: Find user by email
        const userResult = await db.query(
            'SELECT id, password FROM users WHERE email = $1',
            [email]
        );
        if (userResult.rows.length === 0) return null;

        const user = userResult.rows[0];

        // Step 2: Compare provided password with the bcrypt hash stored in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

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
                "INSERT INTO user_roles (user_id, role) VALUES ($1, $2)",
                [userId, 'user']
            );

            await client.query('COMMIT');

            return {
                user_id: userId,
                full_name: fullName,
                email,
                avatar_url: null,
                role: 'user',
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
};