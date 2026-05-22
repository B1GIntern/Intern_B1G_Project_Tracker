import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { JwtPayload } from '../models/user.model';
import { sendError } from '../utils/response';

// Extend Express Request to carry the decoded JWT payload
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// Runs before any protected route.
// Reads the JWT from the Authorization header: Bearer <token>
// Verifies it and attaches { userId, role } to req.user
// Blocks with 401 if token is missing or invalid
export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendError(res, 'Unauthorized. No token provided.', 401);
        return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        sendError(res, 'Unauthorized. Invalid or expired token.', 401);
        return;
    }

    req.user = decoded; // { userId, role }
    next();
};