# Supabase Seed Data System

This directory contains everything you need to populate your Supabase database with seed data for the B1G Project Tracker.

## Files Overview

- `seed-data-complete.sql` - Complete SQL script for manual execution in Supabase SQL Editor
- `functions/seed-database/index.ts` - Edge Function for programmatic seed data management
- `README-SEED.md` - This file with usage instructions

## Method 1: Direct SQL Execution (Recommended for Initial Setup)

1. Open your Supabase project dashboard
2. Go to the **SQL Editor**
3. Copy and paste the entire contents of `seed-data-complete.sql`
4. Click **Run** to execute the script
5. Wait for completion - you'll see a summary table with record counts

**What this does:**
- Creates 10 users in `auth.users` with proper authentication setup
- Creates 5 departments
- Creates user profiles linked to auth users
- Creates user roles
- Creates 6 sample tasks
- Creates 8 sample notifications

**Login Credentials:**
- Email: Any of the created emails (e.g., `admin@b1gcorp.com`)
- Password: `password123`

## Method 2: Edge Function (Recommended for Programmatic Management)

### Deploy the Edge Function

```bash
# From your project root directory
supabase functions deploy seed-database
```

### Using the Edge Function

#### Check Current Status
```bash
curl -X GET 'https://your-project-ref.supabase.co/functions/v1/seed-database' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

#### Inject Seed Data
```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/seed-database' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "seed", "clearExisting": false}'
```

#### Clear Existing Data
```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/seed-database' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "clear"}'
```

#### Clear and Re-seed
```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/seed-database' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "seed", "clearExisting": true}'
```

### Frontend Integration

You can call the Edge Function from your frontend:

```javascript
// Check seed status
const checkStatus = async () => {
  const response = await fetch('https://your-project-ref.supabase.co/functions/v1/seed-database', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${supabaseClient.supabaseKey}`,
      'Content-Type': 'application/json'
    }
  })
  return await response.json()
}

// Inject seed data
const injectSeedData = async (clearExisting = false) => {
  const response = await fetch('https://your-project-ref.supabase.co/functions/v1/seed-database', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseClient.supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'seed',
      clearExisting
    })
  })
  return await response.json()
}
```

## Data Structure

### Users Created
- **Admin**: `admin@b1gcorp.com` (Super Admin)
- **Managers**: `john.engineer@b1gcorp.com`, `sarah.marketing@b1gcorp.com`, `mike.sales@b1gcorp.com`
- **Employees**: `dev1@b1gcorp.com`, `dev2@b1gcorp.com`, `marketing1@b1gcorp.com`, `sales1@b1gcorp.com`, `hr1@b1gcorp.com`, `finance1@b1gcorp.com`

### Departments
- Engineering
- Marketing  
- Sales
- HR
- Finance

### Tasks (6 total)
- Database Optimization (todo)
- User Authentication (in_progress)
- Marketing Campaign (underreview)
- Sales Dashboard (approved)
- HR Onboarding (completed)
- Financial Report (declined)

### Notifications (8 total)
Various task assignments, updates, and system notifications

## Environment Variables Required

For the Edge Function to work, ensure these environment variables are set in your Supabase project:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (has admin privileges)

## Troubleshooting

### Common Issues

1. **"relation does not exist" errors**
   - Make sure your database schema is properly set up before running seed scripts
   - Run your schema migration first

2. **Authentication errors**
   - Ensure you're using the SERVICE_ROLE_KEY for Edge Function calls
   - The function needs admin privileges to create auth users

3. **Foreign key constraint errors**
   - The SQL script handles dependencies in the correct order
   - If using Edge Function, ensure clearExisting=true if you're re-seeding

4. **Permission denied errors**
   - Check that your service role key has proper permissions
   - Ensure RLS policies allow service role operations

### Verification

After seeding, you can verify the data was created correctly:

```sql
-- Check all tables
SELECT 
  'auth.users' as table_name, COUNT(*) as record_count FROM auth.users
UNION ALL
SELECT 'departments' as table_name, COUNT(*) as record_count FROM departments
UNION ALL
SELECT 'profile' as table_name, COUNT(*) as record_count FROM profile
UNION ALL
SELECT 'users_role' as table_name, COUNT(*) as record_count FROM users_role
UNION ALL
SELECT 'tracker_tasks' as table_name, COUNT(*) as record_count FROM tracker_tasks
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as record_count FROM notifications
ORDER BY table_name;
```

Expected results:
- auth.users: 10
- auth.identities: 10
- departments: 5
- profile: 10
- users_role: 10
- tracker_tasks: 6
- notifications: 8

## Security Notes

- All users are created with the same password: `password123`
- In production, you should change these passwords or implement password reset functionality
- The service role key should be kept secure and only used server-side
- Consider implementing proper user management for production deployments

## Support

If you encounter issues:
1. Check the Supabase logs for Edge Function errors
2. Verify your database schema matches expectations
3. Ensure all environment variables are properly set
4. Test with smaller datasets first to isolate issues
