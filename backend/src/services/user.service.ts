import bcrypt from 'bcryptjs';
import { db } from '../config/db';
import { DisplayUser, TeamMember, AppRole } from '../models/user.model';

export const userService = {
    getAllUsers: async (): Promise<DisplayUser[]> => {
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
      ORDER BY p.full_name ASC`
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

            const hashedPassword = await bcrypt.hash(data.password, 10);

            const userResult = await client.query(
                'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
                [data.email, hashedPassword]
            );
            const userId = userResult.rows[0].id;

            await client.query(
                'INSERT INTO profiles (user_id, full_name, email) VALUES ($1, $2, $3)',
                [userId, data.full_name, data.email]
            );

            await client.query(
                'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
                [userId, data.role]
            );

            if (data.department_id) {
                await client.query(
                    'INSERT INTO user_departments (user_id, department_id) VALUES ($1, $2)',
                    [userId, data.department_id]
                );
            }

            await client.query('COMMIT');

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
        data: { full_name?: string; role?: AppRole; department_id?: string }
    ): Promise<DisplayUser | null> => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            if (data.full_name) {
                await client.query(
                    'UPDATE profiles SET full_name = $1 WHERE user_id = $2',
                    [data.full_name, userId]
                );
            }

            if (data.role) {
                await client.query(
                    'UPDATE user_roles SET role = $1 WHERE user_id = $2',
                    [data.role, userId]
                );
            }

            if (data.department_id !== undefined) {
                await client.query(
                    'DELETE FROM user_departments WHERE user_id = $1',
                    [userId]
                );
                if (data.department_id) {
                    await client.query(
                        'INSERT INTO user_departments (user_id, department_id) VALUES ($1, $2)',
                        [userId, data.department_id]
                    );
                }
            }

            await client.query('COMMIT');

            const result = await db.query(
                `SELECT u.id AS user_id, p.full_name, p.email, p.avatar_url,
                ur.role, ud.department_id, d.name AS department_name
         FROM users u
         JOIN profiles p ON p.user_id = u.id
         JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN user_departments ud ON ud.user_id = u.id
         LEFT JOIN departments d ON d.id = ud.department_id
         WHERE u.id = $1`,
                [userId]
            );
            return result.rows[0] ?? null;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    deleteUser: async (userId: string): Promise<boolean> => {
        const result = await db.query(
            'DELETE FROM users WHERE id = $1',
            [userId]
        );
        return (result.rowCount ?? 0) > 0;
    },

    getTeam: async (userId: string, role: string): Promise<TeamMember[]> => {
        if (role === 'admin') {
            const result = await db.query(
                `SELECT u.id AS user_id, p.full_name, p.email, p.avatar_url,
                ur.role, ud.department_id, d.name AS department_name
         FROM users u
         JOIN profiles p ON p.user_id = u.id
         JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN user_departments ud ON ud.user_id = u.id
         LEFT JOIN departments d ON d.id = ud.department_id
         ORDER BY p.full_name ASC`
            );
            return result.rows;
        }

        const result = await db.query(
            `SELECT u.id AS user_id, p.full_name, p.email, p.avatar_url,
              ur.role, ud.department_id, d.name AS department_name
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN user_departments ud ON ud.user_id = u.id
       JOIN departments d ON d.id = ud.department_id
       WHERE ud.department_id = (
         SELECT department_id FROM user_departments WHERE user_id = $1 LIMIT 1
       )
       ORDER BY p.full_name ASC`,
            [userId]
        );
        return result.rows;
    },
};