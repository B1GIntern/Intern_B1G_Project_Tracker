const fs = require('fs');
const path = require('path');

console.log('🔧 Database Setup Helper');
console.log('========================');
console.log('');
console.log('To connect your database, you need to:');
console.log('');
console.log('1. Create a .env file in the backend folder');
console.log('2. Add your DATABASE_URL to the .env file');
console.log('');
console.log('Example DATABASE_URL formats:');
console.log('');
console.log('📄 PostgreSQL:');
console.log('postgresql://username:password@localhost:5432/database_name');
console.log('');
console.log('🌐 Supabase:');
console.log('postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres');
console.log('');
console.log('📄 SQLite (for development):');
console.log('sqlite:./database.sqlite');
console.log('');
console.log('After setting up DATABASE_URL, restart your server with:');
console.log('npm run dev');
console.log('');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('DATABASE_URL=')) {
        console.log('✅ DATABASE_URL found in .env');
    } else {
        console.log('❌ DATABASE_URL not found in .env');
    }
} else {
    console.log('❌ .env file not found');
    console.log('');
    console.log('📝 Creating .env.example file for reference...');
}
