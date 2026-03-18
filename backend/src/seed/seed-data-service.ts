import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://rayksxxnwddxktqviuas.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheWtzeHhud2RkeGt0cXZpdWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM4MDk2NiwiZXhwIjoyMDg4OTU2OTY2fQ.V7-8Wz61hU0i4fzHBRp2jLssTKT-UxYudB4f7L713OE';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types for our data structures
export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_name: 'admin' | 'manager' | 'employee';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id?: string;
  department_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackerTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'underreview' | 'approved' | 'completed' | 'declined';
  assigned_to?: string;
  created_by: string;
  department_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_completed' | 'task_updated' | 'system' | 'department_update';
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface SeedUser {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string;
}

// Phase 2: Authentication Flow Functions
export class SeedDataService {
  private supabase = supabase;

  // Create user in Supabase Auth and corresponding profile
  async createUserWithProfile(userData: SeedUser): Promise<{ user: any; profile: Profile | null; role: UserRole | null }> {
    try {
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      const user = authData.user;
      if (!user) {
        throw new Error('User creation returned null');
      }

      // Step 2: Get or create department
      let departmentId: string | undefined;
      if (userData.department) {
        const { data: deptData } = await this.supabase
          .from('departments')
          .select('id')
          .eq('name', userData.department)
          .single();
        
        if (deptData) {
          departmentId = deptData.id;
        }
      }

      // Step 3: Create user role
      const { data: roleData, error: roleError } = await this.supabase
        .from('users_role')
        .insert({
          user_id: user.id,
          role_name: userData.role
        })
        .select()
        .single();

      if (roleError) {
        throw new Error(`Failed to create user role: ${roleError.message}`);
      }

      // Step 4: Create profile
      const { data: profileData, error: profileError } = await this.supabase
        .from('profile')
        .insert({
          id: user.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role_id: roleData.id,
          department_id: departmentId
        })
        .select()
        .single();

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      return {
        user,
        profile: profileData,
        role: roleData
      };

    } catch (error) {
      console.error('Error creating user with profile:', error);
      throw error;
    }
  }

  // Create department
  async createDepartment(name: string, description?: string, managerId?: string): Promise<Department> {
    try {
      const { data, error } = await this.supabase
        .from('departments')
        .insert({
          name,
          description,
          manager_id: managerId
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create department: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  // Create task
  async createTask(taskData: Omit<TrackerTask, 'id' | 'created_at' | 'updated_at'>): Promise<TrackerTask> {
    try {
      const { data, error } = await this.supabase
        .from('tracker_tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create task: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Create notification
  async createNotification(notificationData: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          ...notificationData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Execute schema creation
  async executeSchema(schemaSQL: string): Promise<{ success: boolean; message: string; result?: any }> {
    try {
      const { data, error } = await this.supabase.rpc('exec_sql', { sql: schemaSQL });
      
      if (error) {
        throw new Error(`Schema execution failed: ${error.message}`);
      }

      return {
        success: true,
        message: 'Schema executed successfully',
        result: data
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check table status
  async checkTableStatus(): Promise<{ tables: string[]; counts: Record<string, number> }> {
    try {
      const tables = ['departments', 'users_role', 'profile', 'tracker_tasks', 'notifications'];
      const counts: Record<string, number> = {};

      for (const table of tables) {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        counts[table] = error ? 0 : count || 0;
      }

      return {
        tables,
        counts
      };
    } catch (error) {
      console.error('Error checking table status:', error);
      return {
        tables: [],
        counts: {}
      };
    }
  }
}
