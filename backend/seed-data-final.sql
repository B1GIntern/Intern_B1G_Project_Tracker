-- B1G Project Tracker - Supabase Compatible Seed Data

-- DEPARTMENTS
INSERT INTO departments (id, name, manager_id) VALUES
(gen_random_uuid(), 'Engineering', NULL);

-- USER ROLES
INSERT INTO user_roles (id, role_name, description) VALUES
(gen_random_uuid(), 'admin', 'System administrator with full access'),
(gen_random_uuid(), 'manager', 'Department manager with team management capabilities'),
(gen_random_uuid(), 'user', 'Regular user with basic task management access')
ON CONFLICT (role_name) DO NOTHING;

-- USERS
INSERT INTO users (id, email, password_hash, full_name, role, department_id, is_active) VALUES
(gen_random_uuid(), 'admin@b1g.com', '$2b$10$rQZ8kHWKtGYmP3qXqFqZ9OqZ8kHWKtGYmP3qXqFqZ9OqZ8kHWKtGYm', 'System Administrator', 'admin', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1), true);

-- PROFILES
INSERT INTO profiles (id, user_id, avatar_url, bio) VALUES
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), NULL, 'System administrator account with access to all features');

-- USER ROLE ASSIGNMENTS
INSERT INTO user_role_assignments (id, user_id, role_id, assigned_at) VALUES
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM user_roles WHERE role_name = 'admin' LIMIT 1), CURRENT_TIMESTAMP);

-- USER DEPARTMENT ASSIGNMENTS
INSERT INTO user_departments (id, user_id, department_id, joined_at) VALUES
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1), CURRENT_TIMESTAMP);

-- TASKS
INSERT INTO tasks (id, title, description, status, progress, priority, due_date, assigned_to, created_by, department_id, comments, attachment_keys) VALUES
(gen_random_uuid(), 'Setup Development Environment', 'Configure development tools and environment for the project', 'todo', 0, 3, CURRENT_DATE + INTERVAL '7 days', (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1), '[]', '{}'),
(gen_random_uuid(), 'Database Schema Design', 'Design and implement complete database schema for the project tracking system', 'in_progress', 75, 2, CURRENT_DATE + INTERVAL '3 days', (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1), '[]', '{}'),
(gen_random_uuid(), 'API Development', 'Develop REST API endpoints for task management, user management, and notifications', 'completed', 100, 2, CURRENT_DATE + INTERVAL '14 days', (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1), '[]', '{}'),
(gen_random_uuid(), 'Frontend Development', 'Build React components and user interface for the task management system', 'under_review', 90, 3, CURRENT_DATE + INTERVAL '10 days', (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1), '[]', '{}'),
(gen_random_uuid(), 'Testing & Deployment', 'Write unit tests and deploy the application to production', 'todo', 0, 1, CURRENT_DATE + INTERVAL '21 days', (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1), '[]', '{}');

-- NOTIFICATIONS
INSERT INTO notifications (id, user_id, type, title, message, task_id, is_read) VALUES
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), 'task_assigned', 'New Task Assigned', 'You have been assigned a new task: Setup Development Environment', (SELECT id FROM tasks WHERE title = 'Setup Development Environment' LIMIT 1), false),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), 'task_due', 'Task Due Soon', 'Task "Database Schema Design" is due in 3 days', (SELECT id FROM tasks WHERE title = 'Database Schema Design' LIMIT 1), false),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), 'task_completed', 'Task Completed', 'Task "Database Schema Design" has been completed successfully', (SELECT id FROM tasks WHERE title = 'Database Schema Design' LIMIT 1), false),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@b1g.com' LIMIT 1), 'info', 'System Update', 'Welcome to B1G Project Tracker! Your account has been set up successfully.', NULL, false);
