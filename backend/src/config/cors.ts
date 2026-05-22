import cors from 'cors';
import { env } from './env';

// CORS configuration — allows the React frontend to send requests to this backend
// credentials: true is required so the frontend can send the JWT token in headers
export const corsOptions = cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});