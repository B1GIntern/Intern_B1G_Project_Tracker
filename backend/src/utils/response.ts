import { Response } from 'express';

// Sends a standardized success JSON response.
// All successful API responses use this format: { success: true, data: ... }
export const sendSuccess = (res: Response, data: unknown, status = 200): void => {
    res.status(status).json({ success: true, data });
};

// Sends a standardized error JSON response.
// All error API responses use this format: { success: false, error: '...' }
export const sendError = (res: Response, message: string, status = 400): void => {
    res.status(status).json({ success: false, error: message });
};