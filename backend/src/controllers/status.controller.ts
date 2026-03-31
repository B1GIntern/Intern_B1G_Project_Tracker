import { Request, Response } from 'express';
import { db } from '../config/db';

export const getBackendStatus = (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'backend is running on frontend',
        status: 'running',
        timestamp: new Date().toISOString()
    });
};

export const getDatabaseStatus = async (req: Request, res: Response) => {
    try {
        const { error } = await db.from('users').select('count').limit(1);
        if (error) throw error;

        res.json({
            success: true,
            message: 'database is running with the backend and frontend',
            status: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Database connection test failed:', errorMessage);

        res.status(500).json({
            success: false,
            message: 'database connection failed',
            status: 'disconnected',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};

export const getAllStatus = async (req: Request, res: Response) => {
    let dbStatus: string;

    try {
        const { error } = await db.from('users').select('count').limit(1);
        dbStatus = error ? 'disconnected' : 'connected';
    } catch (error) {
        dbStatus = 'disconnected';
    }

    res.json({
        success: true,
        backend: {
            message: 'backend is running on frontend',
            status: 'running'
        },
        database: {
            message: dbStatus === 'connected'
                ? 'database is running with the backend and frontend'
                : 'database connection failed',
            status: dbStatus
        },
        timestamp: new Date().toISOString()
    });
};