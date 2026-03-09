import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import TaskCard from '@/components/TaskCard';
import TaskDetailPanel from '@/components/TaskDetailPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Search } from 'lucide-react';

interface Task {
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

interface Profile {
  user_id: string;
  full_name: string;
}

interface Department {
  id: string;
  name: string;
}

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-muted' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-info/10' },
  { id: 'under_review', label: 'Under Review', color: 'bg-warning/10' },
  { id: 'completed', label: 'Done', color: 'bg-success/10' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
];

const Tracker = () => {
  const { user, role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [myDeptIds, setMyDeptIds] = useState<string[]>([]);
  const [teamUserIds, setTeamUserIds] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !role) return;

    const [profilesRes, deptsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name'),
      supabase.from('departments').select('id, name'),
    ]);

    const allProfiles = profilesRes.data || [];
    const allDepts = deptsRes.data || [];
    setProfiles(allProfiles);
    setDepartments(allDepts);

    let tasksQuery = supabase.from('tasks').select('*').order('created_at', { ascending: false });

    if (role === 'manager') {
      // Manager: fetch tasks only in their department(s)
      const { data: myDepts } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('user_id', user.id);

      const deptIds = (myDepts || []).map(d => d.department_id);
      setMyDeptIds(deptIds);

      if (deptIds.length > 0) {
        tasksQuery = tasksQuery.in('department_id', deptIds);

        // Also get team user IDs for the user filter dropdown
        const { data: deptUsers } = await supabase
          .from('user_departments')
          .select('user_id')
          .in('department_id', deptIds);

        const uids = [...new Set((deptUsers || []).map(u => u.user_id))];
        setTeamUserIds(uids);
      }

    } else if (role === 'user') {
      // User: only sees tasks assigned to them
      tasksQuery = tasksQuery.eq('assigned_to', user.id);
    }
    // Admin: no filter — sees everything

    const { data: tasksData } = await tasksQuery;

    const tasksList = (tasksData || []).map(t => ({
      ...t,
      assignee_name: allProfiles.find(p => p.user_id === t.assigned_to)?.full_name,
    }));

    setTasks(tasksList);
  }, [user, role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter tasks client-side based on search/dept/user/status dropdowns
  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDept !== 'all' && t.department_id !== filterDept) return false;
    if (filterUser !== 'all' && t.assigned_to !== filterUser) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const getColumnTasks = (columnId: string) => {
    if (columnId === 'completed') {
      return filtered.filter(t => ['completed', 'approved', 'declined'].includes(t.status));
    }
    return filtered.filter(t => t.status === columnId);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    const progressMap: Record<string, number> = {
      todo: 0,
      in_progress: 50,
      under_review: 90,
      completed: 100,
    };

    await supabase.from('tasks').update({
      status: newStatus as any,
      progress: progressMap[newStatus] ?? task.progress,
    }).eq('id', taskId);
  };

  const openNew = () => {
    setSelectedTask(null);
    setIsNew(true);
    setDetailOpen(true);
  };

  const openTask = (task: Task) => {
    setSelectedTask(task);
    setIsNew(false);
    setDetailOpen(true);
  };

  // Team members for the manager's user filter dropdown
  const teamProfiles = profiles.filter(p => teamUserIds.includes(p.user_id));

  // Departments scoped to manager's dept(s) for display; admin sees all
  const visibleDepts = role === 'admin'
    ? departments
    : departments.filter(d => myDeptIds.includes(d.id));

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Task Tracker</h1>
            <p className="text-muted-foreground text-sm">
              {role === 'admin'
                ? 'View and manage all tasks across all departments'
                : role === 'manager'
                  ? 'Manage your department tasks and team workload'
                  : 'View and manage your assigned tasks'}
            </p>
          </div>
          {/* Both admin and user can create tasks; manager can too */}
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search — all roles */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Department filter — admin only */}
          {role === 'admin' && (
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* User filter — manager only (filters by team member) */}
          {role === 'manager' && teamProfiles.length > 0 && (
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {teamProfiles.map(p => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status filter — all roles */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map(col => {
              const colTasks = getColumnTasks(col.id);
              return (
                <div key={col.id} className="space-y-2">
                  <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${col.color}`}>
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="text-xs text-muted-foreground">{colTasks.length}</span>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] space-y-2 rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-accent/30' : ''
                          }`}
                      >
                        {colTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <TaskCard task={task} onClick={() => openTask(task)} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {colTasks.length === 0 && (
                          <div className="text-center text-muted-foreground text-xs py-8 opacity-50">
                            No tasks
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        <TaskDetailPanel
          task={selectedTask}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onSaved={fetchData}
          profiles={profiles}
          departments={visibleDepts}
          isNew={isNew}
        />
      </div>
    </AppLayout>
  );
};

export default Tracker;