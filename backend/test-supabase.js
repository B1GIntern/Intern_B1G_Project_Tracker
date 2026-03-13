const { Pool } = require('pg');

// Test different Supabase connection formats
const connectionTests = [
    // Your current format
    'postgresql://postgres.zanjuuondafrnnjwdpsl:BFfMe0PiqFeh8Y8U@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
    
    // Alternative format (transaction pooler)
    'postgresql://postgres.zanjuuondafrnnjwdpsl:BFfMe0PiqFeh8Y8U@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
    
    // Direct connection (no pooler)
    'postgresql://postgres.zanjuuondafrnnjwdpsl:BFfMe0PiqFeh8Y8U@aws-1-ap-south-1.supabase.com:5432/postgres',
];

async function testConnections() {
    console.log('🔍 Testing Supabase connection formats...\n');
    
    for (let i = 0; i < connectionTests.length; i++) {
        const connectionString = connectionTests[i];
        console.log(`\n📡 Test ${i + 1}: ${connectionString.substring(0, 50)}...`);
        
        const pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
            max: 1,
            connectionTimeoutMillis: 10000,
        });
        
        try {
            const result = await pool.query('SELECT NOW() as current_time');
            console.log('✅ SUCCESS! Connected to Supabase');
            console.log('🕐 Server time:', result.rows[0].current_time);
            await pool.end();
            return connectionString; // Return working connection string
        } catch (err) {
            console.log('❌ Failed:', err.message);
            await pool.end();
        }
    }
    
    console.log('\n💡 All connection attempts failed. Please check:');
    console.log('1. Supabase project is active');
    console.log('2. Database password is correct');
    console.log('3. Connection pooling is enabled');
    console.log('4. Data API is enabled in project settings');
}

testConnections().catch(console.error);
