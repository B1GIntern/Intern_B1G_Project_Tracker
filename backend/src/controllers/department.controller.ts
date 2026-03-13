import { Request, Response } from 'express';
import { departmentService } from '../services/department.service';
import { sendSuccess, sendError } from '../utils/response';
import { getMissingField, isValidUUID } from '../utils/validators';

export const departmentController = {

    getDashboardStats: async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId, role } = req.user!;
            const stats = await departmentService.getDashboardStats(userId, role);
            sendSuccess(res, stats);
        } catch {
            sendError(res, 'Failed to fetch dashboard stats', 500);
        }
    },

    getAllDepartments: async (_req: Request, res: Response): Promise<void> => {
        try {
            const departments = await departmentService.getAllDepartments();
            sendSuccess(res, departments);
        } catch {
            sendError(res, 'Failed to fetch departments', 500);
        }
    },

    createDepartment: async (req: Request, res: Response): Promise<void> => {
        try {
            const missing = getMissingField(req.body, ['name']);
            if (missing) { sendError(res, `${missing} is required`); return; }

            const department = await departmentService.createDepartment(req.body);
            sendSuccess(res, department, 201);
        } catch (err: any) {
            if (err.code === '23505') {
                sendError(res, 'Department name already exists', 409);
            } else {
                sendError(res, 'Failed to create department', 500);
            }
        }
    },

    updateDepartment: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = String(req.params.id);
            if (!isValidUUID(id)) { sendError(res, 'Invalid department ID'); return; }

            const department = await departmentService.updateDepartment(id, req.body);
            if (!department) { sendError(res, 'Department not found or nothing to update', 404); return; }
            sendSuccess(res, department);
        } catch {
            sendError(res, 'Failed to update department', 500);
        }
    },

    deleteDepartment: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = String(req.params.id);
            if (!isValidUUID(id)) { sendError(res, 'Invalid department ID'); return; }

            const deleted = await departmentService.deleteDepartment(id);
            if (!deleted) { sendError(res, 'Department not found', 404); return; }
            sendSuccess(res, { message: 'Department deleted successfully' });
        } catch {
            sendError(res, 'Failed to delete department', 500);
        }
    },
};