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
            console.log('Create user request body:', req.body);
            
            const missing = getMissingField(req.body, ['full_name', 'email', 'password', 'role']);
            if (missing) { 
                console.error('Missing field:', missing);
                sendError(res, `${missing} is required`); 
                return; 
            }

            if (!isValidEmail(req.body.email)) { 
                console.error('Invalid email:', req.body.email);
                sendError(res, 'Invalid email format'); 
                return; 
            }
            if (!isValidPassword(req.body.password)) { 
                console.error('Invalid password length');
                sendError(res, 'Password must be at least 8 characters'); 
                return; 
            }
            if (!isValidRole(req.body.role)) { 
                console.error('Invalid role:', req.body.role);
                sendError(res, 'Role must be admin, manager, or employee'); 
                return; 
            }

            const { full_name, email, password, role, department_id } = req.body;
            console.log('Creating user:', { full_name, email, role, department_id });
            
            const user = await userService.createUser({ full_name, email, password, role, department_id });
            console.log('User created successfully:', user);
            
            sendSuccess(res, user, 201);
        } catch (err: any) {
            console.error('Create user error:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            
            // Handle specific Supabase errors
            if (err.code === 'email_exists' || err.message?.includes('already been registered')) {
                sendError(res, 'Email already exists in authentication system', 409);
            } else if (err.code === '23505') {
                sendError(res, 'Email already exists', 409);
            } else {
                sendError(res, 'Failed to create user', 500);
            }
        }
    },

    updateUser: async (req: Request, res: Response): Promise<void> => {
        try {
            const user_id = String(req.params.user_id);
            console.log('[UserController] Update user request:', {
                user_id,
                body: req.body
            });
            
            if (!isValidUUID(user_id)) { sendError(res, 'Invalid user ID'); return; }
            if (req.body.role && !isValidRole(req.body.role)) { sendError(res, 'Role must be admin, manager, or employee'); return; }

            const user = await userService.updateUser(user_id, req.body);
            if (!user) { sendError(res, 'User not found', 404); return; }
            sendSuccess(res, user);
        } catch (err: any) {
            console.error('[UserController] Update user error:', err);
            console.error('[UserController] Error details:', {
                message: err.message,
                code: err.code,
                stack: err.stack
            });
            sendError(res, 'Failed to update user', 500);
        }
    },

    updateProfile: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const { full_name, email } = req.body;

            // All authenticated users can update their full_name and email
            const updateData: any = {};
            if (full_name) updateData.full_name = full_name;
            if (email) updateData.email = email;

            const user = await userService.updateUser(userId, updateData);
            if (!user) { sendError(res, 'User not found', 404); return; }
            sendSuccess(res, user);
        } catch {
            sendError(res, 'Failed to update profile', 500);
        }
    },

    deleteUser: async (req: Request, res: Response): Promise<void> => {
        try {
            const user_id = String(req.params.user_id);
            if (!isValidUUID(user_id)) { sendError(res, 'Invalid user ID'); return; }

            const deleted = await userService.deleteUser(user_id);
            if (!deleted) { sendError(res, 'User not found', 404); return; }
            sendSuccess(res, { message: 'User deleted successfully' });
        } catch (err: any) {
            console.error('Delete user error:', err);
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                detail: err.detail,
                hint: err.hint
            });
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