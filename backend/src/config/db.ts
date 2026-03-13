import { Pool } from 'pg';
import { env } from './env';

// Custom Backend Database Configuration - External Database Only
console.log('🔍 Custom Backend Database Setup');
console.log('🌐 Connecting to external database:', env.DATABASE_URL ? 'CONFIGURED' : 'NOT SET');

let db: Pool;

if (!env.DATABASE_URL || env.DATABASE_URL.trim() === '') {
    throw new Error('❌ DATABASE_URL is not configured. Please set your external database connection string in .env file.');
}

// Force external database connection
console.log('🔧 Initializing external database connection...');

try {
    db = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
        max: parseInt(env.DB_POOL_MAX),
        min: parseInt(env.DB_POOL_MIN),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        // Additional settings for external database
        statement_timeout: 30000,
        query_timeout: 30000,
        application_name: 'b1g_project_tracker',
    });
    
    console.log('✅ Database pool created, testing connection...');
    
    // Test connection immediately
    db.query('SELECT 1')
        .then(() => {
            console.log('✅ External database connected successfully!');
        })
        .catch((err: any) => {
            console.error('❌ External database connection failed:', err.message);
            console.error('💡 Please check your DATABASE_URL configuration');
            console.error('💡 Ensure your database server is accessible and credentials are correct');
            throw err;
        });
        
} catch (err: any) {
    console.error('❌ Database initialization failed:', err.message);
    console.error('💡 Please verify your DATABASE_URL in .env file');
    throw new Error(`Database connection failed: ${err.message}`);
}

export { db };