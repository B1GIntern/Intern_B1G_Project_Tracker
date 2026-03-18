-- Complete Seed Data for Supabase Database (using @b1g.com domain)
-- Run this in Supabase SQL Editor to populate all tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== AUTH USERS ====================
-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@b1g.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Super","last_name":"Admin","role":"admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Insert remaining users
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
VALUES 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'john.engineer@b1g.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"John","last_name":"Engineer","role":"manager"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.marketing@b1g.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Sarah","last_name":"Marketing","role":"manager"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mike.sales@b1g.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Mike","last_name":"Sales","role":"manager"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev1@b1g.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Alex","last_name":"Developer","role":"employee"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev2@b1g.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Jane","last_name":"Coder","role":"employee"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marketing1@b1g.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Emily","last_name":"Creative","role":"employee"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sales1@b1g.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Robert","last_name":"Closer","role":"employee"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hr1@b1g.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Lisa","last_name":"People","role":"employee"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'finance1@b1g.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"David","last_name":"Numbers","role":"employee"}', NOW(), NOW(), '', '', '', '');

-- ==================== AUTH IDENTITIES ====================
-- Create identities for all users (required for login to work)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, created_at, updated_at
)
SELECT 
  id,
  id,
  format('{"sub": "%s", "email": "%s"}', id::text, email)::jsonb,
  'email',
  id::text,
  NOW(),
  NOW()
FROM auth.users;

-- ==================== DEPARTMENTS ====================
INSERT INTO departments (id, name, description, created_at) VALUES
  (gen_random_uuid(), 'Engineering', 'Software development and infrastructure', NOW()),
  (gen_random_uuid(), 'Marketing', 'Marketing and brand management', NOW()),
  (gen_random_uuid(), 'Sales', 'Sales and customer relations', NOW()),
  (gen_random_uuid(), 'HR', 'Human resources and employee management', NOW()),
  (gen_random_uuid(), 'Finance', 'Financial planning and accounting', NOW());

-- ==================== PROFILES ====================
-- Create profiles for all users with explicit metadata extraction
INSERT INTO profile (id, email, first_name, last_name, department_id, created_at)
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN u.email = 'admin@b1g.com' THEN 'Super'
    WHEN u.email = 'john.engineer@b1g.com' THEN 'John'
    WHEN u.email = 'sarah.marketing@b1g.com' THEN 'Sarah'
    WHEN u.email = 'mike.sales@b1g.com' THEN 'Mike'
    WHEN u.email = 'dev1@b1g.com' THEN 'Alex'
    WHEN u.email = 'dev2@b1g.com' THEN 'Jane'
    WHEN u.email = 'marketing1@b1g.com' THEN 'Emily'
    WHEN u.email = 'sales1@b1g.com' THEN 'Robert'
    WHEN u.email = 'hr1@b1g.com' THEN 'Lisa'
    WHEN u.email = 'finance1@b1g.com' THEN 'David'
    ELSE 'Unknown'
  END as first_name,
  CASE 
    WHEN u.email = 'admin@b1g.com' THEN 'Admin'
    WHEN u.email = 'john.engineer@b1g.com' THEN 'Engineer'
    WHEN u.email = 'sarah.marketing@b1g.com' THEN 'Marketing'
    WHEN u.email = 'mike.sales@b1g.com' THEN 'Sales'
    WHEN u.email = 'dev1@b1g.com' THEN 'Developer'
    WHEN u.email = 'dev2@b1g.com' THEN 'Coder'
    WHEN u.email = 'marketing1@b1g.com' THEN 'Creative'
    WHEN u.email = 'sales1@b1g.com' THEN 'Closer'
    WHEN u.email = 'hr1@b1g.com' THEN 'People'
    WHEN u.email = 'finance1@b1g.com' THEN 'Numbers'
    ELSE 'User'
  END as last_name,
  d.id,
  NOW()
FROM auth.users u
JOIN departments d ON d.name = CASE 
  WHEN u.email = 'admin@b1g.com' THEN 'Engineering'
  WHEN u.email LIKE '%engineer%' THEN 'Engineering'
  WHEN u.email LIKE '%dev%' THEN 'Engineering'
  WHEN u.email LIKE '%marketing%' THEN 'Marketing'
  WHEN u.email LIKE '%sales%' THEN 'Sales'
  WHEN u.email LIKE '%hr%' THEN 'HR'
  WHEN u.email LIKE '%finance%' THEN 'Finance'
  ELSE 'Engineering'
END;

-- ==================== USER ROLES ====================
-- Create user roles with explicit role mapping
INSERT INTO users_role (id, user_id, role_name, created_at)
SELECT 
  gen_random_uuid(),
  u.id,
  CASE 
    WHEN u.email = 'admin@b1g.com' THEN 'admin'
    WHEN u.email LIKE '%engineer%' THEN 'manager'
    WHEN u.email LIKE '%marketing%' THEN 'manager'
    WHEN u.email LIKE '%sales%' THEN 'manager'
    WHEN u.email LIKE '%dev%' THEN 'employee'
    WHEN u.email LIKE '%hr%' THEN 'employee'
    WHEN u.email LIKE '%finance%' THEN 'employee'
    ELSE 'employee'
  END as role_name,
  NOW()
FROM auth.users u;

-- Update profile role_id to reference users_role
UPDATE profile 
SET role_id = ur.id 
FROM users_role ur 
WHERE profile.id = ur.user_id;

-- ==================== TASKS ====================
-- Create sample tasks
INSERT INTO tracker_tasks (id, title, description, status, assigned_to, created_by, department_id, created_at) VALUES
  (gen_random_uuid(), 'Database Optimization', 'Optimize database queries and improve performance', 'todo', 
   (SELECT id FROM profile WHERE email = 'dev1@b1g.com'), 
   (SELECT id FROM profile WHERE email = 'john.engineer@b1g.com'),
   (SELECT id FROM departments WHERE name = 'Engineering'), NOW()),
   
  (gen_random_uuid(), 'User Authentication', 'Implement secure user login system', 'in_progress',
   (SELECT id FROM profile WHERE email = 'dev2@b1g.com'),
   (SELECT id FROM profile WHERE email = 'admin@b1g.com'),
   (SELECT id FROM departments WHERE name = 'Engineering'), NOW()),
   
  (gen_random_uuid(), 'Marketing Campaign', 'Q1 product launch campaign', 'underreview',
   (SELECT id FROM profile WHERE email = 'marketing1@b1g.com'),
   (SELECT id FROM profile WHERE email = 'sarah.marketing@b1g.com'),
   (SELECT id FROM departments WHERE name = 'Marketing'), NOW()),
   
  (gen_random_uuid(), 'Sales Dashboard', 'Build sales analytics dashboard', 'approved',
   (SELECT id FROM profile WHERE email = 'sales1@b1g.com'),
   (SELECT id FROM profile WHERE email = 'mike.sales@b1g.com'),
   (SELECT id FROM departments WHERE name = 'Sales'), NOW()),
   
  (gen_random_uuid(), 'HR Onboarding', 'New employee onboarding process', 'completed',
   (SELECT id FROM profile WHERE email = 'hr1@b1g.com'),
   (SELECT id FROM profile WHERE email = 'hr1@b1g.com'),
   (SELECT id FROM departments WHERE name = 'HR'), NOW()),
   
  (gen_random_uuid(), 'Financial Report', 'Monthly financial analysis', 'declined',
   (SELECT id FROM profile WHERE email = 'finance1@b1g.com'),
   (SELECT id FROM profile WHERE email = 'finance1@b1g.com'),
   (SELECT id FROM departments WHERE name = 'Finance'), NOW());

-- ==================== NOTIFICATIONS ====================
-- Create sample notifications
INSERT INTO notifications (id, user_id, title, message, type, created_at) VALUES
  (gen_random_uuid(), (SELECT id FROM profile WHERE email = 'dev1@b1g.com'), 
   'New Task Assigned', 'You have been assigned a new task: "Database Optimization"', 'task_assigned', NOW()),
   
  (gen_random_uuid(), (SELECT id FROM profile WHERE email = 'dev2@b1g.com'),
   'Task Update Required', 'Your task "User Authentication" needs an update', 'task_updated', NOW()),
   
  (gen_random_uuid(), (SELECT id FROM profile WHERE email = 'marketing1@b1g.com'),
   'Task Completed', 'Task "Marketing Campaign" is ready for review', 'task_completed', NOW()),
   
  (gen_random_uuid(), (SELECT id FROM profile WHERE email = 'sales1@b1g.com'),
   'Congratulations!', 'Task "Sales Dashboard" has been completed successfully', 'task_completed', NOW()),
   
  (gen_random_uuid(), (SELECT id FROM profile WHERE email = 'admin@b1g.com'),
   'System Update', 'New users have been added to the system', 'system', NOW()),
   
  (gen_random_uuid(), (SELECT id FROM profile WHERE email = 'john.engineer@b1g.com'),
   'Department Update', 'Engineering department tasks have been updated', 'department_update', NOW()),
   
  (gen_random_uuid(), (SELECT id FROM profile WHERE email = 'sarah.marketing@b1g.com'),
   'New Campaign', 'Marketing campaign "Q1 Launch" has been initiated', 'task_assigned', NOW()),
   
  (gen_random_uuid(), (SELECT id FROM profile WHERE email = 'hr1@b1g.com'),
   'Process Approved', 'Employee onboarding process has been approved', 'system', NOW());

-- ==================== VERIFICATION ====================
-- Display summary of inserted data
SELECT 
  'auth.users' as table_name, COUNT(*) as record_count FROM auth.users
UNION ALL
SELECT 
  'auth.identities' as table_name, COUNT(*) as record_count FROM auth.identities
UNION ALL
SELECT 
  'departments' as table_name, COUNT(*) as record_count FROM departments
UNION ALL
SELECT 
  'profile' as table_name, COUNT(*) as record_count FROM profile
UNION ALL
SELECT 
  'users_role' as table_name, COUNT(*) as record_count FROM users_role
UNION ALL
SELECT 
  'tracker_tasks' as table_name, COUNT(*) as record_count FROM tracker_tasks
UNION ALL
SELECT 
  'notifications' as table_name, COUNT(*) as record_count FROM notifications
ORDER BY table_name;

-- Seed data completed successfully!
-- You can now login with any of these emails using password: password123
