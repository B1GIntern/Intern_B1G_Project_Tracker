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
        // Test database connection with a simple query
        await db.query('SELECT 1');
        
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
            suggestion: 'Please check DATABASE_URL in .env file',
            timestamp: new Date().toISOString()
        });
    }
};

export const getAllStatus = async (req: Request, res: Response) => {
    let dbStatus: string;
    
    try {
        // Test database connection
        await db.query('SELECT 1');
        dbStatus = 'connected';
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
            message: dbStatus === 'connected' ? 'database is running with the backend and frontend' : 'database connection failed',
            status: dbStatus
        },
        timestamp: new Date().toISOString()
    });
};
