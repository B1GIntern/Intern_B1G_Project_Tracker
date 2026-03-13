import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';
import { getMissingField, isValidEmail, isValidPassword, isValidRole, isValidUUID } from '../utils/validators';

export const userController = {

    getAllUsers: async (_req: Request, res: Response): Promise<void> => {
        try {
            const users = await userService.getAllUsers();
            sendSuccess(res, users);
        } catch {
            sendError(res, 'Failed to fetch users', 500);
        }
    },

    createUser: async (req: Request, res: Response): Promise<void> => {
        try {
            const missing = getMissingField(req.body, ['full_name', 'email', 'password', 'role']);
            if (missing) { sendError(res, `${missing} is required`); return; }

            if (!isValidEmail(req.body.email)) { sendError(res, 'Invalid email format'); return; }
            if (!isValidPassword(req.body.password)) { sendError(res, 'Password must be at least 8 characters'); return; }
            if (!isValidRole(req.body.role)) { sendError(res, 'Role must be admin, manager, or user'); return; }

            const { full_name, email, password, role, department_id } = req.body;
            const user = await userService.createUser({ full_name, email, password, role, department_id });
            sendSuccess(res, user, 201);
        } catch (err: any) {
            if (err.code === '23505') {
                sendError(res, 'Email already exists', 409);
            } else {
                sendError(res, 'Failed to create user', 500);
            }
        }
    },

    updateUser: async (req: Request, res: Response): Promise<void> => {
        try {
            const user_id = String(req.params.user_id);
            if (!isValidUUID(user_id)) { sendError(res, 'Invalid user ID'); return; }
            if (req.body.role && !isValidRole(req.body.role)) { sendError(res, 'Role must be admin, manager, or user'); return; }

            const user = await userService.updateUser(user_id, req.body);
            if (!user) { sendError(res, 'User not found', 404); return; }
            sendSuccess(res, user);
        } catch {
            sendError(res, 'Failed to update user', 500);
        }
    },

    deleteUser: async (req: Request, res: Response): Promise<void> => {
        try {
            const user_id = String(req.params.user_id);
            if (!isValidUUID(user_id)) { sendError(res, 'Invalid user ID'); return; }

            const deleted = await userService.deleteUser(user_id);
            if (!deleted) { sendError(res, 'User not found', 404); return; }
            sendSuccess(res, { message: 'User deleted successfully' });
        } catch {
            sendError(res, 'Failed to delete user', 500);
        }
    },

    getTeam: async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId, role } = req.user!;
            const team = await userService.getTeam(userId, role);
            sendSuccess(res, team);
        } catch {
            sendError(res, 'Failed to fetch team', 500);
        }
    },
};