import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Dynamic CORS configuration - responds with correct origin
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (env.ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
});

// backend is running on frontend
// database is running with backend and frontend
