-- Fix role_id in profile table by linking it to users_role table

-- First, add a default role_id for existing profiles that don't have one
UPDATE profile 
SET role_id = (
    SELECT ur.id 
    FROM users_role ur 
    WHERE ur.user_id = profile.id 
    AND ur.role_name = 'employee'
    LIMIT 1
)
WHERE role_id IS NULL
AND EXISTS (
    SELECT 1 FROM users_role ur WHERE ur.user_id = profile.id
);

-- For profiles without any role, assign default employee role
UPDATE profile 
SET role_id = (
    SELECT id 
    FROM users_role 
    WHERE role_name = 'employee' 
    LIMIT 1
)
WHERE role_id IS NULL
AND NOT EXISTS (
    SELECT 1 FROM users_role ur WHERE ur.user_id = profile.id
);

-- Create function to update profile.role_id when users_role changes
CREATE OR REPLACE FUNCTION update_profile_role_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile.role_id when users_role is inserted or updated
    UPDATE profile 
    SET role_id = NEW.id
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users_role INSERT
CREATE TRIGGER users_role_insert_trigger
    AFTER INSERT ON users_role
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_role_id();

-- Create trigger for users_role UPDATE
CREATE TRIGGER users_role_update_trigger
    AFTER UPDATE ON users_role
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_role_id();

-- Create trigger for users_role DELETE to clear role_id
CREATE OR REPLACE FUNCTION clear_profile_role_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Clear profile.role_id when users_role is deleted
    UPDATE profile 
    SET role_id = NULL
    WHERE id = OLD.user_id;
    
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Create trigger for users_role DELETE
CREATE TRIGGER users_role_delete_trigger
    AFTER DELETE ON users_role
    FOR EACH ROW
    EXECUTE FUNCTION clear_profile_role_id();
