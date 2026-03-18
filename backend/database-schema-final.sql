-- B1G Project Tracker - Database Schema for Supabase
-- Safe version that handles missing objects gracefully

-- Drop objects safely with error handling
DO $$
BEGIN
    -- Drop views
    BEGIN
        DROP VIEW IF EXISTS department_summary CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP VIEW IF EXISTS task_details CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    -- Drop triggers (only if table exists)
    BEGIN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TRIGGER IF EXISTS update_departments_updated_at ON departments CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    -- Drop functions
    BEGIN
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP FUNCTION IF EXISTS append_attachment_key(UUID, TEXT) CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP FUNCTION IF EXISTS remove_attachment_key(UUID, TEXT) CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    -- Drop tables in correct order
    BEGIN
        DROP TABLE IF EXISTS notifications CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TABLE IF EXISTS user_role_assignments CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TABLE IF EXISTS user_departments CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TABLE IF EXISTS profiles CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TABLE IF EXISTS tasks CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TABLE IF EXISTS users CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TABLE IF EXISTS user_roles CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TABLE IF EXISTS departments CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    -- Drop types
    BEGIN
        DROP TYPE IF EXISTS user_role CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TYPE IF EXISTS task_status CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
    
    BEGIN
        DROP TYPE IF EXISTS notification_type CASCADE;
    EXCEPTION WHEN OTHERS THEN END;
END $$;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');

CREATE TYPE task_status AS ENUM (
    'todo',
    'in_progress',
    'under_review',
    'completed',
    'approved',
    'declined'
);

CREATE TYPE notification_type AS ENUM (
    'task_assigned',
    'task_due',
    'task_overdue',
    'task_completed',
    'task_approved',
    'task_declined',
    'info'
);

-- Create tables in correct order
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    manager_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint after users table exists
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_manager
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name user_role UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES user_roles(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

CREATE TABLE user_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, department_id)
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'todo',
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    due_date TIMESTAMP,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    comments JSONB NOT NULL DEFAULT '[]'::JSONB,
    attachment_keys TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_department_id ON tasks(department_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_comments ON tasks USING GIN (comments);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views
CREATE OR REPLACE VIEW task_details AS
SELECT
    t.id,
    t.title,
    t.description,
    t.status,
    t.progress,
    t.priority,
    t.due_date,
    t.created_at,
    t.updated_at,
    creator.full_name AS created_by_name,
    assignee.full_name AS assigned_to_name,
    dept.name AS department_name,
    jsonb_array_length(t.comments) AS comment_count,
    cardinality(t.attachment_keys) AS attachment_count
FROM tasks t
LEFT JOIN users creator ON creator.id = t.created_by
LEFT JOIN users assignee ON assignee.id = t.assigned_to
LEFT JOIN departments dept ON dept.id = t.department_id;

CREATE OR REPLACE VIEW department_summary AS
SELECT
    d.id,
    d.name,
    COUNT(DISTINCT u.id) AS team_size,
    COUNT(DISTINCT t.id) AS total_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress_tasks
FROM departments d
LEFT JOIN users u ON u.department_id = d.id
LEFT JOIN tasks t ON t.department_id = d.id
GROUP BY d.id, d.name;

-- Create storage helper functions
CREATE OR REPLACE FUNCTION append_attachment_key(task_id UUID, key TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE tasks
    SET attachment_keys = array_append(attachment_keys, key)
    WHERE id = task_id
      AND NOT (key = ANY(attachment_keys));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_attachment_key(task_id UUID, key TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE tasks
    SET attachment_keys = array_remove(attachment_keys, key)
    WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;
