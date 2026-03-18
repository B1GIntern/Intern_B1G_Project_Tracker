import { SeedDataService, SeedUser } from './seed-data-service';

// Phase 3: Seed Data Structure
export class SeedDataGenerator {
  private seedService: SeedDataService;

  constructor() {
    this.seedService = new SeedDataService();
  }

  // Sample departments to create
  private departments = [
    {
      name: 'Engineering',
      description: 'Software development and technical operations'
    },
    {
      name: 'Marketing',
      description: 'Marketing campaigns and brand management'
    },
    {
      name: 'Sales',
      description: 'Sales operations and client relationships'
    },
    {
      name: 'HR',
      description: 'Human resources and employee management'
    },
    {
      name: 'Finance',
      description: 'Financial planning and accounting'
    }
  ];

  // Sample users to create
  private users: SeedUser[] = [
    {
      email: 'admin@b1g.com',
      password: 'Password123!',
      first_name: 'Super',
      last_name: 'Admin',
      role: 'admin',
      department: 'Engineering'
    },
    {
      email: 'john.engineer@b1g.com',
      password: 'Password123!',
      first_name: 'John',
      last_name: 'Engineer',
      role: 'manager',
      department: 'Engineering'
    },
    {
      email: 'sarah.marketing@b1g.com',
      password: 'Password123!',
      first_name: 'Sarah',
      last_name: 'Marketing',
      role: 'manager',
      department: 'Marketing'
    },
    {
      email: 'mike.sales@b1g.com',
      password: 'Password123!',
      first_name: 'Mike',
      last_name: 'Sales',
      role: 'manager',
      department: 'Sales'
    },
    {
      email: 'dev1@b1g.com',
      password: 'Password123!',
      first_name: 'Alex',
      last_name: 'Developer',
      role: 'employee',
      department: 'Engineering'
    },
    {
      email: 'dev2@b1g.com',
      password: 'Password123!',
      first_name: 'Jane',
      last_name: 'Coder',
      role: 'employee',
      department: 'Engineering'
    },
    {
      email: 'marketing1@b1g.com',
      password: 'Password123!',
      first_name: 'Emily',
      last_name: 'Creative',
      role: 'employee',
      department: 'Marketing'
    },
    {
      email: 'sales1@b1g.com',
      password: 'Password123!',
      first_name: 'Robert',
      last_name: 'Closer',
      role: 'employee',
      department: 'Sales'
    },
    {
      email: 'hr1@b1g.com',
      password: 'Password123!',
      first_name: 'Lisa',
      last_name: 'People',
      role: 'employee',
      department: 'HR'
    },
    {
      email: 'finance1@b1g.com',
      password: 'Password123!',
      first_name: 'David',
      last_name: 'Numbers',
      role: 'employee',
      department: 'Finance'
    }
  ];

  // Sample tasks to create
  private generateTasks = (userIds: string[], departmentIds: string[]) => [
    {
      title: 'Setup Development Environment',
      description: 'Configure local development environment with all necessary tools and dependencies',
      status: 'completed' as const,
      assigned_to: userIds[4], // Alex Developer
      created_by: userIds[1], // John Engineer (Manager)
      department_id: departmentIds[0], // Engineering
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    },
    {
      title: 'Implement User Authentication',
      description: 'Add user authentication and authorization features to the application',
      status: 'in_progress' as const,
      assigned_to: userIds[5], // Jane Coder
      created_by: userIds[1], // John Engineer
      department_id: departmentIds[0], // Engineering
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
    },
    {
      title: 'Create Marketing Campaign',
      description: 'Design and launch Q1 marketing campaign for new product launch',
      status: 'todo' as const,
      assigned_to: userIds[6], // Emily Creative
      created_by: userIds[2], // Sarah Marketing (Manager)
      department_id: departmentIds[1], // Marketing
      due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days from now
    },
    {
      title: 'Sales Pipeline Review',
      description: 'Review and update sales pipeline for Q1 targets',
      status: 'underreview' as const,
      assigned_to: userIds[7], // Robert Closer
      created_by: userIds[3], // Mike Sales (Manager)
      department_id: departmentIds[2], // Sales
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
    },
    {
      title: 'Employee Onboarding Process',
      description: 'Streamline employee onboarding process for new hires',
      status: 'approved' as const,
      assigned_to: userIds[8], // Lisa People
      created_by: userIds[0], // Super Admin
      department_id: departmentIds[3], // HR
      due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days from now
    },
    {
      title: 'Budget Planning Q2',
      description: 'Prepare and finalize budget planning for Q2 2024',
      status: 'todo' as const,
      assigned_to: userIds[9], // David Numbers
      created_by: userIds[0], // Super Admin
      department_id: departmentIds[4], // Finance
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    },
    {
      title: 'Database Optimization',
      description: 'Optimize database queries and improve performance',
      status: 'in_progress' as const,
      assigned_to: userIds[4], // Alex Developer
      created_by: userIds[1], // John Engineer
      department_id: departmentIds[0], // Engineering
      due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString() // 12 days from now
    },
    {
      title: 'Social Media Strategy',
      description: 'Develop comprehensive social media strategy for brand awareness',
      status: 'underreview' as const,
      assigned_to: userIds[6], // Emily Creative
      created_by: userIds[2], // Sarah Marketing
      department_id: departmentIds[1], // Marketing
      due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days from now
    },
    {
      title: 'Client Meeting Preparation',
      description: 'Prepare presentation and materials for major client meeting',
      status: 'completed' as const,
      assigned_to: userIds[7], // Robert Closer
      created_by: userIds[3], // Mike Sales
      department_id: departmentIds[2], // Sales
      due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago (completed)
    },
    {
      title: 'Security Audit',
      description: 'Conduct comprehensive security audit of the application',
      status: 'declined' as const,
      assigned_to: userIds[5], // Jane Coder
      created_by: userIds[1], // John Engineer
      department_id: departmentIds[0], // Engineering
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days from now
    }
  ];

  // Generate notifications based on created tasks and users
  private generateNotifications = (userIds: string[], taskIds: string[]) => [
    {
      user_id: userIds[4], // Alex Developer
      title: 'New Task Assigned',
      message: 'You have been assigned a new task: "Database Optimization"',
      type: 'task_assigned' as const,
      is_read: false
    },
    {
      user_id: userIds[5], // Jane Coder
      title: 'Task Update Required',
      message: 'Your task "Implement User Authentication" needs an update',
      type: 'task_updated' as const,
      is_read: false
    },
    {
      user_id: userIds[6], // Emily Creative
      title: 'Task Completed',
      message: 'Task "Social Media Strategy" is ready for review',
      type: 'task_completed' as const,
      is_read: false
    },
    {
      user_id: userIds[7], // Robert Closer
      title: 'Congratulations!',
      message: 'Task "Client Meeting Preparation" has been completed successfully',
      type: 'task_completed' as const,
      is_read: false
    },
    {
      user_id: userIds[0], // Super Admin
      title: 'System Update',
      message: 'New users have been added to the system',
      type: 'system' as const,
      is_read: false
    },
    {
      user_id: userIds[1], // John Engineer
      title: 'Department Update',
      message: 'Engineering department tasks have been updated',
      type: 'department_update' as const,
      is_read: false
    },
    {
      user_id: userIds[2], // Sarah Marketing
      title: 'New Campaign',
      message: 'Marketing campaign "Q1 Launch" has been initiated',
      type: 'task_assigned' as const,
      is_read: false
    },
    {
      user_id: userIds[8], // Lisa People
      title: 'Process Approved',
      message: 'Employee onboarding process has been approved',
      type: 'system' as const,
      is_read: false
    }
  ];

  // Main function to generate all seed data
  async generateAllSeedData(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🌱 Starting seed data generation...');

      // Step 1: Create departments
      console.log('📁 Creating departments...');
      const createdDepartments = [];
      for (const dept of this.departments) {
        const department = await this.seedService.createDepartment(dept.name, dept.description);
        createdDepartments.push(department);
        console.log(`✅ Created department: ${dept.name}`);
      }

      // Step 2: Create users with profiles
      console.log('👥 Creating users...');
      const createdUsers = [];
      for (const user of this.users) {
        const userResult = await this.seedService.createUserWithProfile(user);
        createdUsers.push(userResult);
        console.log(`✅ Created user: ${user.email}`);
      }

      // Extract IDs for relationships
      const userIds = createdUsers.map(u => u.user.id);
      const departmentIds = createdDepartments.map(d => d.id);

      // Step 3: Update department managers
      console.log('👔 Assigning department managers...');
      for (let i = 0; i < createdDepartments.length; i++) {
        const managerIndex = i + 1; // Skip admin, start with first manager
        if (managerIndex < userIds.length) {
          await this.seedService.createDepartment(
            createdDepartments[i].name,
            createdDepartments[i].description,
            userIds[managerIndex]
          );
          console.log(`✅ Assigned manager to ${createdDepartments[i].name}`);
        }
      }

      // Step 4: Create tasks
      console.log('📋 Creating tasks...');
      const tasks = this.generateTasks(userIds, departmentIds);
      const createdTasks = [];
      for (const task of tasks) {
        const createdTask = await this.seedService.createTask(task);
        createdTasks.push(createdTask);
        console.log(`✅ Created task: ${task.title}`);
      }

      // Step 5: Create notifications
      console.log('🔔 Creating notifications...');
      const notifications = this.generateNotifications(userIds, createdTasks.map(t => t.id));
      const createdNotifications = [];
      for (const notification of notifications) {
        const createdNotification = await this.seedService.createNotification(notification);
        createdNotifications.push(createdNotification);
        console.log(`✅ Created notification: ${notification.title}`);
      }

      console.log('🎉 Seed data generation completed successfully!');

      return {
        success: true,
        message: 'All seed data generated successfully',
        data: {
          departments: createdDepartments.length,
          users: createdUsers.length,
          tasks: createdTasks.length,
          notifications: createdNotifications.length
        }
      };

    } catch (error) {
      console.error('❌ Seed data generation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get seed data summary without creating
  getSeedDataSummary() {
    return {
      departments: this.departments.length,
      users: this.users.length,
      tasks: this.generateTasks([], []).length,
      notifications: this.generateNotifications([], []).length,
      userRoles: {
        admin: this.users.filter(u => u.role === 'admin').length,
        manager: this.users.filter(u => u.role === 'manager').length,
        employee: this.users.filter(u => u.role === 'employee').length
      }
    };
  }
}
