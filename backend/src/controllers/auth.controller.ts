import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { signToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { isValidEmail, isValidPassword, getMissingField } from '../utils/validators';

export const authController = {

    // GET /api/auth/me
    // Reads userId from verified JWT (req.user) and returns full user profile
    getMe: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const user = await authService.getMe(userId);
            if (!user) { sendError(res, 'User not found', 404); return; }
            sendSuccess(res, { user, profile: user, role: user.role });
        } catch {
            sendError(res, 'Failed to get user', 500);
        }
    },

    // POST /api/auth/login
    // Validates email + password, signs a JWT token, returns token + user data
    // Frontend stores this token and sends it as: Authorization: Bearer <token>
    login: async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;

            const missing = getMissingField(req.body, ['email', 'password']);
            if (missing) { sendError(res, `${missing} is required`); return; }

            if (!isValidEmail(email)) { sendError(res, 'Invalid email format'); return; }

            const user = await authService.login(email, password);
            if (!user) { sendError(res, 'Invalid email or password', 401); return; }

            const token = signToken({ userId: user.user_id, role: user.role });
            sendSuccess(res, { token, user, profile: user, role: user.role });
        } catch {
            sendError(res, 'Login failed', 500);
        }
    },

    // POST /api/auth/logout
    // JWT is stateless — no server-side session to destroy.
    // The frontend simply deletes the token from localStorage/memory.
    logout: (_req: Request, res: Response): void => {
        sendSuccess(res, { message: 'Logged out successfully' });
    },

    // POST /api/auth/signup
    // Creates a new user account and returns the new user + token
    signup: async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password, fullName } = req.body;

            const missing = getMissingField(req.body, ['email', 'password', 'fullName']);
            if (missing) { sendError(res, `${missing} is required`); return; }

            if (!isValidEmail(email)) { sendError(res, 'Invalid email format'); return; }
            if (!isValidPassword(password)) { sendError(res, 'Password must be at least 8 characters'); return; }

            const user = await authService.signup(email, password, fullName);
            const token = signToken({ userId: user.user_id, role: user.role });
            sendSuccess(res, { token, user }, 201);
        } catch (err: any) {
            if (err.code === '23505') {
                sendError(res, 'Email already exists', 409);
            } else {
                sendError(res, 'Signup failed', 500);
            }
        }
    },
};