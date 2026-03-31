import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import TaskCard from '@/components/TaskCard';
import TaskDetailPanel from '@/components/TaskDetailPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus, Search, Users, Building2, CheckSquare, Calendar,
  SlidersHorizontal, AlertCircle, LayoutGrid, Grip,
} from 'lucide-react';
import { getMockTasks, getMockProfiles, getMockDepartments, getRoleBasedIds } from '@/lib/mockData';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

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
  role?: string;
  department_id?: string;
}

interface Department {
  id: string;
  name: string;
}

interface TrackerData {
  tasks: Task[];
  profiles: Profile[];
  departments: Department[];
  teamUserIds: string[];
  myDeptIds: string[];
}

/* ─── Column config with refined accent colours ─── */
const COLUMNS = [
  {
    id: 'todo',
    label: 'To Do',
    accent: 'border-slate-300 dark:border-slate-600',
    dot: 'bg-slate-400',
    headerBg: 'bg-slate-100/80 dark:bg-slate-800/60',
    dropBg: 'bg-slate-50/60 dark:bg-slate-800/30',
    dragOver: 'bg-slate-100 dark:bg-slate-700/40 ring-2 ring-slate-300 dark:ring-slate-500',
    count: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    accent: 'border-amber-300 dark:border-amber-500/50',
    dot: 'bg-amber-400',
    headerBg: 'bg-amber-50/80 dark:bg-amber-900/20',
    dropBg: 'bg-amber-50/30 dark:bg-amber-900/10',
    dragOver: 'bg-amber-50 dark:bg-amber-900/30 ring-2 ring-amber-300 dark:ring-amber-500',
    count: 'bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'underreview',
    label: 'Under Review',
    accent: 'border-violet-300 dark:border-violet-500/50',
    dot: 'bg-violet-400',
    headerBg: 'bg-violet-50/80 dark:bg-violet-900/20',
    dropBg: 'bg-violet-50/30 dark:bg-violet-900/10',
    dragOver: 'bg-violet-50 dark:bg-violet-900/30 ring-2 ring-violet-300 dark:ring-violet-500',
    count: 'bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300',
  },
  {
    id: 'completed',
    label: 'Done',
    accent: 'border-emerald-300 dark:border-emerald-500/50',
    dot: 'bg-emerald-400',
    headerBg: 'bg-emerald-50/80 dark:bg-emerald-900/20',
    dropBg: 'bg-emerald-50/30 dark:bg-emerald-900/10',
    dragOver: 'bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-300 dark:ring-emerald-500',
    count: 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300',
  },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

/* ─── Empty column placeholder ─── */
function EmptyColumn({ isLocked }: { isLocked?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {isLocked
          ? <AlertCircle className="h-5 w-5 text-slate-400" />
          : <Grip className="h-5 w-5 text-slate-300 dark:text-slate-600" />}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[120px] leading-relaxed">
        {isLocked ? 'Only Admin/Manager can move tasks here' : 'Drop tasks here'}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main Tracker
══════════════════════════════════════════════════════ */
const Tracker = () => {
  const { user, role, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [myDeptIds, setMyDeptIds] = useState<string[]>([]);
  const [teamUserIds, setTeamUserIds] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [filterDept, setFilterDept] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  /* ── debounce ── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  /* ── search suggestions ── */
  const suggestions = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];
    const sl = debouncedSearch.toLowerCase();
    const all: Array<{ type: string; value: string; label: string; icon: any }> = [];

    tasks.forEach(t => {
      if (t.title?.toLowerCase().includes(sl))
        all.push({ type: 'task', value: t.title, label: `Task: ${t.title}`, icon: CheckSquare });
    });
    profiles.forEach(p => {
      if (p.full_name?.toLowerCase().includes(sl))
        all.push({ type: 'user', value: p.full_name, label: `User: ${p.full_name}`, icon: Users });
    });
    departments.forEach(d => {
      if (d.name?.toLowerCase().includes(sl))
        all.push({ type: 'department', value: d.name, label: `Department: ${d.name}`, icon: Building2 });
    });
    ['todo', 'in_progress', 'underreview', 'completed'].forEach(s => {
      if (s.toLowerCase().includes(sl))
        all.push({ type: 'status', value: s, label: `Status: ${s.replace('_', ' ')}`, icon: Calendar });
    });

    return Array.from(new Map(all.map(s => [s.value, s])).values()).slice(0, 8);
  }, [debouncedSearch, tasks, profiles, departments]);

  /* ── keyboard nav ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSuggestion(p => p < suggestions.length - 1 ? p + 1 : 0); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSuggestion(p => p > 0 ? p - 1 : suggestions.length - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (suggestions[selectedSuggestion]) { setSearch(suggestions[selectedSuggestion].value); setShowSuggestions(false); } }
      else if (e.key === 'Escape') setShowSuggestions(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedSuggestion]);

  /* ── data fetch (unchanged logic) ── */
  const fetchData = useCallback(async () => {
    if (!user || !role) return;
    try {
      const token = localStorage.getItem('b1g_token');
      const res = await fetch(`${API_BASE}/tasks/tracker`, {
        credentials: 'include',
        headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
      });
      if (!res.ok) return;
      const data = await res.json();
      const progressMap: Record<string, number> = { todo: 0, in_progress: 50, underreview: 75, approved: 100, declined: 100, completed: 100 };
      const tasksWithProgress = data.data.tasks.map((task: any) => {
        const assignee = data.data.profiles.find((p: any) => p.user_id === task.assigned_to);
        return { ...task, progress: progressMap[task.status] || 0, assignee_name: assignee?.full_name || null };
      });
      setTasks(tasksWithProgress);
      setProfiles(data.data.profiles);
      setDepartments(data.data.departments);
      const mdi = data.data.departments.filter((d: any) => data.data.profiles.some((p: any) => p.user_id === profile?.id && p.department_id === d.id)).map((d: any) => d.id);
      const tui = role === 'manager' ? data.data.profiles.filter((p: any) => mdi.includes(p.department_id)).map((p: any) => p.user_id) : data.data.profiles.map((p: any) => p.user_id);
      setMyDeptIds(mdi);
      setTeamUserIds(tui);
    } catch {
      const mockTasks = getMockTasks(role);
      const mockProfiles = getMockProfiles();
      const mockDepartments = getMockDepartments();
      const { myDeptIds, teamUserIds } = getRoleBasedIds(role);
      setTasks(mockTasks); setProfiles(mockProfiles); setDepartments(mockDepartments);
      setMyDeptIds(myDeptIds); setTeamUserIds(teamUserIds);
    }
  }, [user, role, profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'overdue') setFilterStatus('overdue');
  }, [searchParams]);

  /* ── filtering ── */
  const filtered = tasks.filter(t => {
    if (debouncedSearch) {
      const sl = debouncedSearch.toLowerCase();
      const matchesTitle = t.title.toLowerCase().includes(sl);
      const matchesDesc = t.description?.toLowerCase().includes(sl);
      const matchesStatus = t.status.toLowerCase().includes(sl);
      const matchesAssignee = t.assigned_to && profiles.find(p => p.user_id === t.assigned_to)?.full_name.toLowerCase().includes(sl);
      const matchesDept = t.department_id && departments.find(d => d.id === t.department_id)?.name.toLowerCase().includes(sl);
      if (!matchesTitle && !matchesDesc && !matchesStatus && !matchesAssignee && !matchesDept) return false;
    }
    if (filterDept !== 'all' && t.department_id !== filterDept) return false;
    if (filterUser !== 'all' && t.assigned_to !== filterUser) return false;
    if (filterStatus === 'overdue') {
      return t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed';
    }
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const getColumnTasks = (columnId: string) => {
    if (columnId === 'completed') return filtered.filter(t => ['completed', 'approved', 'declined'].includes(t.status));
    return filtered.filter(t => t.status === columnId);
  };

  /* ── drag & drop ── */
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    if (role === 'employee' && newStatus === 'completed') return;

    const progressMap: Record<string, number> = { todo: 0, in_progress: 50, underreview: 75, approved: 100, declined: 100, completed: 100 };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, progress: progressMap[newStatus] || 0 } : t));

    try {
      const token = localStorage.getItem('b1g_token');
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status, progress: task.progress } : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status, progress: task.progress } : t));
    }
  };

  const openNew = () => { setSelectedTask(null); setIsNew(true); setDetailOpen(true); };
  const openTask = (task: Task) => { setSelectedTask(task); setIsNew(false); setDetailOpen(true); };

  const teamProfiles = profiles.filter(p => teamUserIds.includes(p.user_id));
  const employeeProfiles = role === 'manager' ? teamProfiles.filter(p => p.role === 'employee') : profiles;
  const visibleDepts = role === 'admin' ? departments : departments.filter(d => myDeptIds.includes(d.id));

  const totalFiltered = filtered.length;
  const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;

  return (
    <AppLayout>
      <div className="relative space-y-5 animate-fade-in pb-12">

        {/* ── Ambient background ── */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-violet-300/10 dark:bg-violet-700/8 blur-3xl" />
          <div className="absolute top-1/3 -left-16 h-56 w-56 rounded-full bg-amber-300/10 dark:bg-amber-700/8 blur-3xl" />
        </div>

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="h-4 w-4 text-violet-500" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
                Kanban Board
              </p>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Task Tracker
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {filterStatus === 'overdue'
                ? 'Showing overdue tasks only'
                : role === 'admin'
                  ? 'View and manage all tasks across all departments'
                  : role === 'manager'
                    ? 'Manage your department tasks and team workload'
                    : 'View and manage your assigned tasks'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Overdue badge */}
            {overdueCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-rose-200 dark:border-rose-800/50
                              bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {overdueCount} overdue
                </span>
              </div>
            )}

            {/* Task count */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10
                            bg-white/70 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {totalFiltered} task{totalFiltered !== 1 ? 's' : ''}
              </span>
            </div>

            {role !== 'employee' && (
              <Button
                onClick={openNew}
                className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-500
                           dark:hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20
                           hover:shadow-violet-500/30 transition-all duration-200 font-semibold"
              >
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            )}
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex flex-wrap gap-2.5 items-center rounded-2xl border border-slate-200/70 dark:border-white/10
                        bg-white/70 dark:bg-white/5 backdrop-blur-md px-4 py-3 shadow-sm">

          <SlidersHorizontal className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />

          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Popover open={showSuggestions && suggestions.length > 0} onOpenChange={setShowSuggestions}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search tasks, users, departments…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowSuggestions(true); setSelectedSuggestion(0); }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-8 h-8 text-sm rounded-lg border-slate-200 dark:border-white/10
                               bg-slate-50 dark:bg-white/5 focus:ring-violet-500/30"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-xl shadow-xl border-slate-200 dark:border-white/10" align="start">
                <Command>
                  <CommandList>
                    <CommandEmpty className="text-xs text-slate-400 py-4 text-center">No suggestions</CommandEmpty>
                    {suggestions.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <CommandItem
                          key={`${s.type}-${s.value}`}
                          value={s.value}
                          onSelect={() => { setSearch(s.value); setShowSuggestions(false); }}
                          className={`cursor-pointer text-sm ${i === selectedSuggestion ? 'bg-violet-50 dark:bg-violet-900/30' : ''}`}
                        >
                          <Icon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                          {s.label}
                        </CommandItem>
                      );
                    })}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Overdue active pill */}
          {filterStatus === 'overdue' && (
            <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20
                            border border-rose-200 dark:border-rose-800/50 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Overdue filter active
            </div>
          )}

          <div className="flex flex-wrap gap-2 ml-auto">
            {role === 'admin' && (
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="h-8 w-40 text-xs rounded-lg border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {role === 'manager' && teamProfiles.length > 0 && (
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="h-8 w-36 text-xs rounded-lg border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Users</SelectItem>
                  {teamProfiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-36 text-xs rounded-lg border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {STATUS_FILTER_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Kanban Board ── */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col, colIdx) => {
              const colTasks = getColumnTasks(col.id);
              const isLockedForEmployee = role === 'employee' && col.id === 'completed';

              return (
                <div
                  key={col.id}
                  className="flex flex-col gap-2"
                  style={{ animationDelay: `${colIdx * 60}ms` }}
                >
                  {/* Column header */}
                  <div className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 border ${col.accent} ${col.headerBg} backdrop-blur-sm`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.dot} ${col.id === 'in_progress' ? 'animate-pulse' : ''}`} />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{col.label}</span>
                    </div>
                    <span className={`text-xs font-black rounded-full px-2 py-0.5 tabular-nums ${col.count}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Drop zone */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                          flex-1 min-h-[240px] max-h-[calc(100vh-300px)] rounded-xl p-2 space-y-2 border transition-all duration-200 overflow-y-auto
                          ${snapshot.isDraggingOver ? col.dragOver : `${col.accent} ${col.dropBg}`}
                          ${isLockedForEmployee ? 'opacity-40 cursor-not-allowed' : ''}
                        `}
                      >
                        {colTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                            isDragDisabled={false}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`transition-transform duration-150 ${snapshot.isDragging ? 'scale-[1.02] rotate-[0.5deg] shadow-2xl' : ''}`}
                              >
                                <TaskCard task={task} onClick={() => openTask(task)} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {colTasks.length === 0 && (
                          <EmptyColumn isLocked={isLockedForEmployee} />
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
          onSaved={() => { fetchData(); setDetailOpen(false); }}
          profiles={role === 'manager' ? employeeProfiles : profiles}
          departments={visibleDepts}
          isNew={isNew}
        />
      </div>
    </AppLayout>
  );
};

export default Tracker;