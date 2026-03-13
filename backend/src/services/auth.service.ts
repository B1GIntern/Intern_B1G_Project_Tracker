import bcrypt from 'bcryptjs';
import { db } from '../config/db';
import { DisplayUser } from '../models/user.model';

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

export const authService = {

    // GET /api/auth/me
    // Returns the logged-in user's full profile using their userId from the JWT
    getMe: async (userId: string): Promise<DisplayUser | null> => {
        return getUserById(userId);
    },

    // POST /api/auth/login
    // Finds user by email, compares bcrypt hashed password, returns user data if valid
    login: async (
        email: string,
        password: string
    ): Promise<DisplayUser | null> => {
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

            // Hash the password before storing
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

            // Assign default role of 'user' — admin can upgrade later
            await client.query(
                "INSERT INTO user_roles (user_id, role) VALUES ($1, 'user')",
                [userId]
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