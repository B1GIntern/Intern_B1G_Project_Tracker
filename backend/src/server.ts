import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { overdueTaskService } from './services/overdue-task.service';

const app = express();

app.use(cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend is running and ready for frontend connections',
        timestamp: new Date().toISOString(),
        port: env.PORT
    });
});

app.use('/api', routes);

app.use(errorHandler);

app.listen(env.PORT, () => {
    console.log('🚀 Server running on http://localhost:' + env.PORT);
    console.log('📡 API available at http://localhost:' + env.PORT + '/api');

    setInterval(async () => {
        try {
            console.log('[Scheduled] Checking for overdue tasks...');
            await overdueTaskService.checkAndNotifyOverdueTasks();
        } catch (error) {
            console.error('[Scheduled] Error checking overdue tasks:', error);
        }
    }, 60 * 1000);

    overdueTaskService.checkAndNotifyOverdueTasks().catch(err => {
        console.error('[Startup] Error checking overdue tasks:', err);
    });
});
