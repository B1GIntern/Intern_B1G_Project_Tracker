import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess, sendError } from '../utils/response';

export const dashboardController = {
    // GET /api/data/dashboard/stats
    getStats: async (req: Request, res: Response): Promise<void> => {
        try {
            // Use real authenticated user data
            const userId = req.user!.userId;
            const role = req.user!.role;
            
            console.log('Dashboard stats request - User:', userId, 'Role:', role);
            
            const stats = await dashboardService.getStats(userId, role);
            sendSuccess(res, stats);
        } catch (err: any) {
            console.error('Dashboard stats error:', err);
            sendError(res, 'Failed to fetch dashboard stats', 500);
        }
    },

    // GET /api/data/dashboard/chart-data
    getChartData: async (req: Request, res: Response): Promise<void> => {
        try {
            // Use real authenticated user data
            const userId = req.user!.userId;
            const role = req.user!.role;
            
            console.log('Dashboard chart data request - User:', userId, 'Role:', role);
            
            const chartData = await dashboardService.getChartData(userId, role);
            sendSuccess(res, chartData);
        } catch (err: any) {
            console.error('Dashboard chart data error:', err);
            sendError(res, 'Failed to fetch dashboard chart data', 500);
        }
    },

    // GET /api/data/dashboard/user-performance
    getUserPerformance: async (req: Request, res: Response): Promise<void> => {
        console.log('[Controller] User performance endpoint HIT');
        try {
            // Use real authenticated user data
            const userId = req.user!.userId;
            const role = req.user!.role;
            const queryUserId = req.query.userId as string;
            
            console.log('User performance request - User:', userId, 'Role:', role, 'QueryUserId:', queryUserId);
            
            const performanceData = await dashboardService.getUserPerformance(userId, role, queryUserId);
            sendSuccess(res, performanceData);
        } catch (err: any) {
            console.error('User performance error:', err);
            if (err.message === 'Access denied') {
                sendError(res, 'Access denied', 403);
            } else {
                sendError(res, 'Failed to fetch user performance data', 500);
            }
        }
    }
};
