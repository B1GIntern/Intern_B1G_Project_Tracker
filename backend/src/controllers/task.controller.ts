import { Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { sendSuccess, sendError } from '../utils/response';
import { getMissingField, isValidUUID, isValidProgress } from '../utils/validators';

export const taskController = {

    getTracker: async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId, role } = req.user!;
            const data = await taskService.getTracker(userId, role);
            sendSuccess(res, data);
        } catch {
            sendError(res, 'Failed to fetch tracker data', 500);
        }
    },

    getAllTasks: async (_req: Request, res: Response): Promise<void> => {
        try {
            const tasks = await taskService.getAllTasks();
            sendSuccess(res, tasks);
        } catch {
            sendError(res, 'Failed to fetch tasks', 500);
        }
    },

    createTask: async (req: Request, res: Response): Promise<void> => {
        try {
            const missing = getMissingField(req.body, ['title']);
            if (missing) { sendError(res, `${missing} is required`); return; }

            if (req.body.progress !== undefined && !isValidProgress(req.body.progress)) {
                sendError(res, 'Progress must be between 0 and 100');
                return;
            }

            const userId = req.user!.userId;
            const task = await taskService.createTask(req.body, userId);
            sendSuccess(res, task, 201);
        } catch {
            sendError(res, 'Failed to create task', 500);
        }
    },

    updateTask: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = String(req.params.id);
            if (!isValidUUID(id)) { sendError(res, 'Invalid task ID'); return; }

            if (req.body.progress !== undefined && !isValidProgress(req.body.progress)) {
                sendError(res, 'Progress must be between 0 and 100');
                return;
            }

            const task = await taskService.updateTask(id, req.body);
            if (!task) { sendError(res, 'Task not found or nothing to update', 404); return; }
            sendSuccess(res, task);
        } catch {
            sendError(res, 'Failed to update task', 500);
        }
    },

    deleteTask: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = String(req.params.id);
            if (!isValidUUID(id)) { sendError(res, 'Invalid task ID'); return; }

            const deleted = await taskService.deleteTask(id);
            if (!deleted) { sendError(res, 'Task not found', 404); return; }
            sendSuccess(res, { message: 'Task deleted successfully' });
        } catch {
            sendError(res, 'Failed to delete task', 500);
        }
    },

    getAttachments: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = String(req.params.id);
            const attachments = await taskService.getAttachments(id);
            sendSuccess(res, attachments);
        } catch {
            sendError(res, 'Failed to fetch attachments', 500);
        }
    },

    addAttachment: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) { sendError(res, 'No file uploaded'); return; }
            const id = String(req.params.id);
            const userId = req.user!.userId;
            const attachment = await taskService.addAttachment(id, userId, req.file);
            sendSuccess(res, attachment, 201);
        } catch {
            sendError(res, 'Failed to upload attachment', 500);
        }
    },

    deleteAttachment: async (req: Request, res: Response): Promise<void> => {
        try {
            const attId = String(req.params.attId);
            const deleted = await taskService.deleteAttachment(attId);
            if (!deleted) { sendError(res, 'Attachment not found', 404); return; }
            sendSuccess(res, { message: 'Attachment deleted successfully' });
        } catch {
            sendError(res, 'Failed to delete attachment', 500);
        }
    },
};