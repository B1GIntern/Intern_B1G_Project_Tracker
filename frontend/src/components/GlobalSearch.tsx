import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, ListTodo, User, Building2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  status?: string;
}

interface SearchResult {
  type: 'task' | 'user' | 'department';
  id: string;
  label: string;
  sublabel?: string;
}

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Get user role from localStorage
  const userStr = localStorage.getItem('b1g_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isManager = user?.role === 'manager';
  const isEmployee = user?.role === 'employee';

  // Fetch real departments from API (admin only)
  useEffect(() => {
    if (isManager || isEmployee) return; // Skip for managers and employees
    
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('b1g_token');
        if (!token) return;
        
        const res = await fetch(`${API_BASE}/departments`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('b1g_token');
            localStorage.removeItem('b1g_user');
            return;
          }
          throw new Error('Failed to fetch departments');
        }
        
        const data = await res.json();
        setDepartments(data.data || []);
      } catch (error) {
        console.error('Failed to fetch departments for search:', error);
      }
    };
    
    fetchDepartments();
  }, [isManager]);

  // Fetch users from API (managers only - not for employees or admins in search)
  useEffect(() => {
    // Only fetch for managers
    if (!isManager) return;
    
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('b1g_token');
        if (!token) return;
        
        // Managers fetch their team members
        const res = await fetch(`${API_BASE}/users/team`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('b1g_token');
            localStorage.removeItem('b1g_user');
            return;
          }
          throw new Error('Failed to fetch users');
        }
        
        const data = await res.json();
        setUsers(data.data || []);
      } catch (error) {
        console.error('Failed to fetch users for search:', error);
      }
    };
    
    fetchUsers();
  }, [isManager]);

  // Fetch real tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('b1g_token');
        if (!token) return;
        
        const res = await fetch(`${API_BASE}/tasks`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('b1g_token');
            localStorage.removeItem('b1g_user');
            return;
          }
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await res.json();
        setTasks(data.data || []);
      } catch (error) {
        console.error('Failed to fetch tasks for search:', error);
      }
    };
    
    fetchTasks();
  }, []);

  // Combine real data from API
  const allData = useMemo(() => {
    const taskResults: SearchResult[] = tasks.map(t => ({
      type: 'task' as const,
      id: t.id,
      label: t.title,
      sublabel: t.status || 'Task'
    }));

    // Employees don't see departments or users
    const deptResults: SearchResult[] = (isManager || isEmployee) ? [] : departments.map(d => ({
      type: 'department' as const,
      id: d.id,
      label: d.name,
      sublabel: d.description || 'Department'
    }));

    // Employees don't see users
    const userResults: SearchResult[] = isEmployee ? [] : users.map(u => ({
      type: 'user' as const,
      id: u.id,
      label: u.full_name,
      sublabel: u.role
    }));

    return [...taskResults, ...deptResults, ...userResults];
  }, [tasks, departments, users, isManager, isEmployee]);

  // Filter results based on query
  const results = useMemo(() => {
    if (query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    return allData.filter(item => 
      item.label.toLowerCase().includes(queryLower) ||
      (item.sublabel && item.sublabel.toLowerCase().includes(queryLower))
    ).slice(0, 8); // Limit to 8 results
  }, [query, allData]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setOpen(results.length > 0 && query.length >= 2);
  }, [results, query]);

  const handleSelect = (r: SearchResult) => {
    setOpen(false);
    setQuery('');
    if (r.type === 'task') navigate('/tracker');
    else if (r.type === 'user') navigate(isManager ? '/team' : '/users');
    else if (r.type === 'department') navigate('/departments');
  };

  const iconMap = { task: ListTodo, user: User, department: Building2 };

  return (
    <div className="relative" ref={ref}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={isEmployee ? "Search tasks..." : isManager ? "Search tasks, team members..." : "Search tasks, users, departments..."}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="pl-9 h-9 bg-muted/50 w-full"
      />
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {results.map((r, i) => {
            const Icon = iconMap[r.type];
            return (
              <button
                key={`${r.type}-${r.id}-${i}`}
                onClick={() => handleSelect(r)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-accent transition-colors text-sm"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.label}</p>
                  {r.sublabel && <p className="text-xs text-muted-foreground truncate capitalize">{r.sublabel}</p>}
                </div>
                <span className="ml-auto text-xs text-muted-foreground capitalize shrink-0">{r.type}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;