import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { overdueTaskService } from './services/overdue-task.service';







const app = express();







// Dynamic CORS configuration - responds with correct origin



app.use(cors({



    origin: function (origin, callback) {



        // Allow requests with no origin (mobile apps, Postman, etc.)



        if (!origin) return callback(null, true);



        



        // Check if origin is in allowed list



        if (env.ALLOWED_ORIGINS.includes(origin)) {



            callback(null, true);



        } else {



            console.log('CORS blocked origin:', origin);



            callback(new Error('Not allowed by CORS'));



        }



    },



    credentials: true,



    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],



    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],



    optionsSuccessStatus: 200



}));



app.use(express.json());



app.use(express.urlencoded({ extended: true }));







// Health check endpoint for frontend



app.get('/health', (req, res) => {



    res.json({



        status: 'OK',



        message: 'Backend is running and ready for frontend connections',



        timestamp: new Date().toISOString(),



        port: env.PORT



    });



});







// Routes = router folder



app.use('/api', routes);







// Error handling middleware (should be last)



app.use(errorHandler);







// Entry point — starts the Express server

app.listen(env.PORT, () => {

    console.log('🚀 Server running on http://localhost:' + env.PORT);

    console.log('📡 API available at http://localhost:' + env.PORT + '/api');

    // Start overdue task checker - runs every 5 minutes
    setInterval(async () => {
        try {
            console.log('[Scheduled] Checking for overdue tasks...');
            await overdueTaskService.checkAndNotifyOverdueTasks();
        } catch (error) {
            console.error('[Scheduled] Error checking overdue tasks:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes

    // Run immediately on startup
    overdueTaskService.checkAndNotifyOverdueTasks().catch(err => {
        console.error('[Startup] Error checking overdue tasks:', err);
    });

});







// backend is running on frontend



// database is running with backend and frontend



