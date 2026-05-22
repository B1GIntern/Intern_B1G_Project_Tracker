import { db } from '../config/db';

/**
 * Migration to drop the progress column from tracker_tasks table
 * Progress is now calculated dynamically based on task status
 */
async function dropProgressColumn() {
    try {
        console.log('Starting migration to drop progress column...');
        
        // Check if the column exists first
        const columnCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'tracker_tasks' 
            AND column_name = 'progress'
        `);
        
        if (columnCheck.rows.length === 0) {
            console.log('Progress column does not exist. Migration not needed.');
            return true;
        }
        
        // Drop the progress column
        await db.query(`
            ALTER TABLE tracker_tasks 
            DROP COLUMN IF EXISTS progress
        `);
        
        console.log('Successfully dropped progress column from tracker_tasks table');
        return true;
    } catch (error) {
        console.error('Migration failed:', error);
        return false;
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    dropProgressColumn()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

export { dropProgressColumn };
