// Hardcoded demo data for B1G Project Tracker
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  department_id: string | null;
  created_at: string;
  assignee_name?: string;
}

export interface Profile {
  user_id: string;
  full_name: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface DisplayUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'user';
  department_id: string;
  department_name: string;
}

export const getMockTasks = (role: string | null): Task[] => [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create mockups and wireframes for the new marketing landing page',
    status: 'todo',
    progress: 0,
    due_date: '2024-03-20',
    assigned_to: '3',
    created_by: '1',
    department_id: '2',
    created_at: '2024-03-01',
    assignee_name: 'Regular User'
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up JWT authentication with refresh tokens',
    status: 'in_progress',
    progress: 65,
    due_date: '2024-03-18',
    assigned_to: '1',
    created_by: '1',
    department_id: '1',
    created_at: '2024-03-05',
    assignee_name: 'Admin User'
  },
  {
    id: '3',
    title: 'Write API documentation',
    description: 'Document all REST API endpoints with examples',
    status: 'in_review',
    progress: 90,
    due_date: '2024-03-15',
    assigned_to: '2',
    created_by: '1',
    department_id: '1',
    created_at: '2024-03-02',
    assignee_name: 'Manager User'
  },
  {
    id: '4',
    title: 'Fix mobile responsive issues',
    description: 'Resolve responsive design problems on mobile devices',
    status: 'completed',
    progress: 100,
    due_date: '2024-03-10',
    assigned_to: '3',
    created_by: '2',
    department_id: '1',
    created_at: '2024-03-01',
    assignee_name: 'Regular User'
  },
  {
    id: '5',
    title: 'Database optimization',
    description: 'Optimize database queries and add indexes',
    status: 'todo',
    progress: 0,
    due_date: '2024-03-25',
    assigned_to: '1',
    created_by: '1',
    department_id: '1',
    created_at: '2024-03-08',
    assignee_name: 'Admin User'
  }
];

export const getMockProfiles = (): Profile[] => [
  { user_id: '1', full_name: 'Admin User' },
  { user_id: '2', full_name: 'Manager User' },
  { user_id: '3', full_name: 'Regular User' }
];

export const getMockDepartments = (): Department[] => [
  { id: '1', name: 'Engineering' },
  { id: '2', name: 'Marketing' },
  { id: '3', name: 'Sales' },
  { id: '4', name: 'HR' },
  { id: '5', name: 'Finance' }
];

export const getMockUsers = (): DisplayUser[] => [
  {
    id: '1',
    user_id: '1',
    full_name: 'Admin User',
    email: 'admin@b1g.com',
    avatar_url: null,
    role: 'admin',
    department_id: '1',
    department_name: 'Engineering'
  },
  {
    id: '2',
    user_id: '2',
    full_name: 'Manager User',
    email: 'manager@b1g.com',
    avatar_url: null,
    role: 'manager',
    department_id: '1',
    department_name: 'Engineering'
  },
  {
    id: '3',
    user_id: '3',
    full_name: 'Regular User',
    email: 'user@b1g.com',
    avatar_url: null,
    role: 'user',
    department_id: '1',
    department_name: 'Engineering'
  },
  {
    id: '4',
    user_id: '4',
    full_name: 'Sarah Johnson',
    email: 'sarah@b1g.com',
    avatar_url: null,
    role: 'user',
    department_id: '2',
    department_name: 'Marketing'
  },
  {
    id: '5',
    user_id: '5',
    full_name: 'Mike Wilson',
    email: 'mike@b1g.com',
    avatar_url: null,
    role: 'user',
    department_id: '3',
    department_name: 'Sales'
  }
];

export const getMockNotifications = () => [
  {
    id: '1',
    title: 'Task assigned',
    message: 'You have been assigned to "Design new landing page"',
    type: 'info',
    read: false,
    created_at: '2024-03-12T10:30:00Z',
    task_id: '1'
  },
  {
    id: '2',
    title: 'Task completed',
    message: 'Regular User completed "Fix mobile responsive issues"',
    type: 'success',
    read: false,
    created_at: '2024-03-11T15:45:00Z',
    task_id: '4'
  },
  {
    id: '3',
    title: 'Overdue task',
    message: 'Database optimization is overdue',
    type: 'warning',
    read: true,
    created_at: '2024-03-10T09:00:00Z',
    task_id: '5'
  }
];

export const getRoleBasedIds = (role: string | null) => {
  const myDeptIds = role === 'admin' ? ['1', '2', '3', '4', '5'] : role === 'manager' ? ['1', '2'] : ['1'];
  const teamUserIds = role === 'admin' ? ['1', '2', '3', '4', '5'] : role === 'manager' ? ['1', '2', '3'] : ['3'];
  return { myDeptIds, teamUserIds };
};
