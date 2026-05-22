import { Request, Response, NextFunction } from 'express';
import { AppRole } from '../models/user.model';
import { sendError } from '../utils/response';

// Runs after requireAuth.
// Checks if req.user.role matches the allowed roles.
// Blocks with 403 if the user's role is not permitted.
// Usage: requireRole('admin') or requireRole('admin', 'manager')
export const requireRole = (...roles: AppRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const userRole = req.user?.role;

        if (!userRole || !roles.includes(userRole)) {
            sendError(res, 'Forbidden. You do not have permission to perform this action.', 403);
            return;
        }

        next();
    };
};