const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkNotificationCount() {
  try {
    // Get user ID from profile (assuming first user for testing)
    const profileResult = await pool.query('SELECT id FROM profile LIMIT 1');
    if (profileResult.rows.length === 0) {
      console.log('No users found');
      return;
    }
    
    const userId = profileResult.rows[0].id;
    console.log('User ID:', userId);
    
    // Check unread notifications count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );
    
    const unreadCount = parseInt(unreadResult.rows[0].count);
    console.log('Unread notifications count:', unreadCount);
    
    // Check total notifications count
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
      [userId]
    );
    
    const totalCount = parseInt(totalResult.rows[0].count);
    console.log('Total notifications count:', totalCount);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkNotificationCount();
