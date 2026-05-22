import { DirectSeedService } from './direct-seed-service';

export class DirectSeedGenerator {
    private seedService: DirectSeedService;

    constructor() {
        this.seedService = new DirectSeedService();
    }

    async generateAllSeedData() {
        try {
            console.log('🌱 Starting direct seed data generation...');
            
            let successCount = 0;
            let errorCount = 0;

            // 1. Create departments
            console.log('📁 Creating departments...');
            const departments = [
                { name: 'Engineering', description: 'Software development and infrastructure' },
                { name: 'Marketing', description: 'Marketing and brand management' },
                { name: 'Sales', description: 'Sales and customer relations' },
                { name: 'HR', description: 'Human resources and employee management' },
                { name: 'Finance', description: 'Financial planning and accounting' }
            ];

            for (const dept of departments) {
                const result = await this.seedService.createDepartment(dept);
                if (result.success) successCount++;
                else errorCount++;
            }

            // 2. Create users
            console.log('👥 Creating users...');
            const users = [
                {
                    email: 'admin@b1g.com',
                    first_name: 'Super',
                    last_name: 'Admin',
                    role_name: 'admin',
                    department_id: '1' // Engineering
                },
                {
                    email: 'john.engineer@b1g.com',
                    first_name: 'John',
                    last_name: 'Engineer',
                    role_name: 'manager',
                    department_id: '1'
                },
                {
                    email: 'sarah.marketing@b1g.com',
                    first_name: 'Sarah',
                    last_name: 'Marketing',
                    role_name: 'manager',
                    department_id: '2'
                },
                {
                    email: 'mike.sales@b1g.com',
                    first_name: 'Mike',
                    last_name: 'Sales',
                    role_name: 'manager',
                    department_id: '3'
                },
                {
                    email: 'dev1@b1g.com',
                    first_name: 'Alex',
                    last_name: 'Developer',
                    role_name: 'employee',
                    department_id: '1'
                },
                {
                    email: 'dev2@b1g.com',
                    first_name: 'Jane',
                    last_name: 'Coder',
                    role_name: 'employee',
                    department_id: '1'
                },
                {
                    email: 'marketing1@b1g.com',
                    first_name: 'Emily',
                    last_name: 'Creative',
                    role_name: 'employee',
                    department_id: '2'
                },
                {
                    email: 'sales1@b1g.com',
                    first_name: 'Robert',
                    last_name: 'Closer',
                    role_name: 'employee',
                    department_id: '3'
                },
                {
                    email: 'hr1@b1g.com',
                    first_name: 'Lisa',
                    last_name: 'People',
                    role_name: 'employee',
                    department_id: '4'
                },
                {
                    email: 'finance1@b1g.com',
                    first_name: 'David',
                    last_name: 'Numbers',
                    role_name: 'employee',
                    department_id: '5'
                }
            ];

            for (const user of users) {
                const result = await this.seedService.createUser({
                    ...user,
                    password: 'Password123!'
                });
                if (result.success) successCount++;
                else errorCount++;
            }

            // 3. Create tasks
            console.log('📋 Creating tasks...');
            const tasks = [
                {
                    title: 'Database Optimization',
                    description: 'Optimize database queries and improve performance',
                    status: 'todo',
                    created_by: users[1].email, // John Engineer
                    department_id: '1'
                },
                {
                    title: 'User Authentication',
                    description: 'Implement secure user login system',
                    status: 'in_progress',
                    created_by: users[0].email, // Super Admin
                    department_id: '1'
                },
                {
                    title: 'Marketing Campaign',
                    description: 'Q1 product launch campaign',
                    status: 'underreview',
                    created_by: users[2].email, // Sarah Marketing
                    department_id: '2'
                },
                {
                    title: 'Sales Dashboard',
                    description: 'Build sales analytics dashboard',
                    status: 'approved',
                    created_by: users[3].email, // Mike Sales
                    department_id: '3'
                },
                {
                    title: 'HR Onboarding',
                    description: 'New employee onboarding process',
                    status: 'completed',
                    created_by: users[8].email, // Lisa People
                    department_id: '4'
                },
                {
                    title: 'Financial Report',
                    description: 'Monthly financial analysis',
                    status: 'declined',
                    created_by: users[9].email, // David Numbers
                    department_id: '5'
                }
            ];

            for (const task of tasks) {
                const result = await this.seedService.createTask(task);
                if (result.success) successCount++;
                else errorCount++;
            }

            // 4. Create notifications
            console.log('🔔 Creating notifications...');
            const notifications = [
                {
                    user_id: users[4].email, // Alex Developer
                    title: 'New Task Assigned',
                    message: 'You have been assigned a new task: "Database Optimization"',
                    type: 'task_assigned'
                },
                {
                    user_id: users[5].email, // Jane Coder
                    title: 'Task Update Required',
                    message: 'Your task "User Authentication" needs an update',
                    type: 'task_updated'
                },
                {
                    user_id: users[6].email, // Emily Creative
                    title: 'Task Completed',
                    message: 'Task "Marketing Campaign" is ready for review',
                    type: 'task_completed'
                },
                {
                    user_id: users[7].email, // Robert Closer
                    title: 'Congratulations!',
                    message: 'Task "Sales Dashboard" has been completed successfully',
                    type: 'task_completed'
                },
                {
                    user_id: users[0].email, // Super Admin
                    title: 'System Update',
                    message: 'New users have been added to the system',
                    type: 'system'
                },
                {
                    user_id: users[1].email, // John Engineer
                    title: 'Department Update',
                    message: 'Engineering department tasks have been updated',
                    type: 'department_update'
                },
                {
                    user_id: users[2].email, // Sarah Marketing
                    title: 'New Campaign',
                    message: 'Marketing campaign "Q1 Launch" has been initiated',
                    type: 'task_assigned'
                },
                {
                    user_id: users[8].email, // Lisa People
                    title: 'Process Approved',
                    message: 'Employee onboarding process has been approved',
                    type: 'system'
                }
            ];

            for (const notif of notifications) {
                const result = await this.seedService.createNotification(notif);
                if (result.success) successCount++;
                else errorCount++;
            }

            await this.seedService.close();

            return {
                success: errorCount === 0,
                message: `Seed data generation completed: ${successCount} successful, ${errorCount} failed`,
                statementsExecuted: successCount,
                data: {
                    departments: departments.length,
                    users: users.length,
                    tasks: tasks.length,
                    notifications: notifications.length
                }
            };

        } catch (error: any) {
            return {
                success: false,
                message: `Seed data generation failed: ${error.message}`,
                statementsExecuted: 0
            };
        }
    }

    getSeedDataSummary() {
        return {
            departments: 5,
            users: 10,
            tasks: 10,
            notifications: 8,
            userRoles: {
                admin: 1,
                manager: 3,
                employee: 6
            }
        };
    }
}
