const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration: add-progress-to-tasks.sql');
    
    // Add progress column
    await client.query(`
      ALTER TABLE tracker_tasks 
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0
    `);
    console.log('✅ Added progress column');

    // Add constraint
    try {
      await client.query(`
        ALTER TABLE tracker_tasks 
        ADD CONSTRAINT IF NOT EXISTS check_progress_range 
        CHECK (progress >= 0 AND progress <= 100)
      `);
      console.log('✅ Added progress constraint');
    } catch (err) {
      console.log('⚠️  Constraint may already exist:', err.message);
    }

    // Update existing tasks
    const result = await client.query(`
      UPDATE tracker_tasks 
      SET progress = CASE 
        WHEN status = 'completed' THEN 100
        WHEN status = 'in_progress' THEN 50
        WHEN status = 'review' THEN 75
        ELSE 0
      END
      WHERE progress = 0
    `);
    console.log(`✅ Updated ${result.rowCount} existing tasks with progress values`);

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
