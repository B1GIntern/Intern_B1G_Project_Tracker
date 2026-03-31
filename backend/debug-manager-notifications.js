const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkManagerNotifications() {
  try {
    // Find Manager account (Aeron Casin)
    const profileResult = await pool.query(
      'SELECT id, email FROM profile WHERE email ILIKE $1 OR email ILIKE $2',
      ['%aeron%', '%casin%']
    );
    
    if (profileResult.rows.length === 0) {
      console.log('No Manager account found');
      return;
    }
    
    console.log('Found profiles:');
    profileResult.rows.forEach(profile => {
      console.log(`- ID: ${profile.id}, Email: ${profile.email}`);
    });
    
    // Check notifications for each Manager profile
    for (const profile of profileResult.rows) {
      const userId = profile.id;
      
      // Check unread notifications
      const unreadResult = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
        [userId]
      );
      
      const unreadCount = parseInt(unreadResult.rows[0].count);
      console.log(`\nProfile ${profile.email}:`);
      console.log(`- Unread notifications: ${unreadCount}`);
      
      // Check total notifications
      const totalResult = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
        [userId]
      );
      
      const totalCount = parseInt(totalResult.rows[0].count);
      console.log(`- Total notifications: ${totalCount}`);
      
      // Show recent notifications
      const recentResult = await pool.query(
        'SELECT title, message, type, read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [userId]
      );
      
      if (recentResult.rows.length > 0) {
        console.log(`- Recent notifications:`);
        recentResult.rows.forEach((notif, index) => {
          console.log(`  ${index + 1}. [${notif.read ? 'READ' : 'UNREAD'}] ${notif.title}`);
          console.log(`     ${notif.message}`);
        });
      } else {
        console.log(`- No notifications found`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkManagerNotifications();
