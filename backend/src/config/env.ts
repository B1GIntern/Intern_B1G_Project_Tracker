import dotenv from 'dotenv';
dotenv.config(); // Load .env file (contains Supabase URL)

// All environment variables in one place.
// Import from here instead of using process.env directly throughout the app.
export const env = {
    PORT: process.env.PORT || '3000',
    DATABASE_URL: process.env.DATABASE_URL || 'sqlite:./database.sqlite',
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Database pool settings for Supabase
    DB_POOL_MIN: process.env.DB_POOL_MIN || '2',
    DB_POOL_MAX: process.env.DB_POOL_MAX || '10',
    // Additional frontend URLs for development
    ALLOWED_ORIGINS: [
        'http://localhost:5173',  // Vite default
        'http://localhost:3000',  // React default
        'http://localhost:8080',  // Vue default
        'http://localhost:8081',  // Additional frontend port
        'http://localhost:8082',  // Additional frontend port
        'http://localhost:8083',  // Additional frontend port
        'http://127.0.0.1:5173',  // Localhost alternative
        'http://127.0.0.1:3000',  // Localhost alternative
        'http://127.0.0.1:8080',  // Localhost alternative
        'http://127.0.0.1:8081',  // Localhost alternative
        process.env.CLIENT_URL || 'http://localhost:5173'
    ],
};