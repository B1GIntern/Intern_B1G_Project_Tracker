import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../models/user.model';

// Creates a signed JWT token containing userId and role.
// This token is sent to the frontend after login and stored there.
export const signToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
};

// Verifies a JWT token and returns the decoded payload { userId, role }.
// Returns null if the token is invalid or expired.
export const verifyToken = (token: string): JwtPayload | null => {
    try {
        return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
};