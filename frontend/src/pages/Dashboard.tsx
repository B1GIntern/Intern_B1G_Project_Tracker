import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ListTodo, Clock, CheckCircle2, Building2,
  AlertTriangle, Eye, ExternalLink, Users,
  TrendingUp, Activity, Zap, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Area, AreaChart,
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface DashboardStats {
  total: number;
  inProgress: number;
  completed: number;
  departments: number;
  overdue: number;
  underReview: number;
}

/* ─── Animated counter ─── */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

/* ─── Stat pill ─── */
interface StatPillProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;        // Tailwind bg class for the glow dot
  darkAccent: string;    // dark mode variant
  delay?: number;
}
function StatPill({ label, value, icon: Icon, accent, darkAccent, delay = 0 }: StatPillProps) {
  const animated = useCountUp(value);
  return (
    <div
      className="group relative flex items-center gap-4 rounded-2xl border border-slate-200/70 dark:border-white/10
                 bg-white/80 dark:bg-white/5 backdrop-blur-md px-5 py-4 shadow-sm
                 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Coloured glow blob */}
      <span className={`absolute -top-1 -left-1 h-3 w-3 rounded-full ${accent} opacity-80 blur-sm`} />

      <div className={`flex items-center justify-center rounded-xl p-2.5 ${accent} bg-opacity-15 dark:${darkAccent} dark:bg-opacity-20`}>
        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-2xl font-black tabular-nums text-slate-800 dark:text-white leading-none mt-0.5">{animated}</p>
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />
    </div>
  );
}

/* ─── Custom Tooltip ─── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl px-3 py-2 text-xs">
      <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-slate-800 dark:text-white font-bold">{payload[0].value} tasks</p>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   Main Dashboard
══════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    total: 0, inProgress: 0, completed: 0,
    departments: 0, overdue: 0, underReview: 0,
  });
  const [deptChart, setDeptChart] = useState<{ name: string; tasks: number }[]>([]);
  const [trendChart, setTrendChart] = useState<{ date: string; completed: number }[]>([]);
  const [userPerformance, setUserPerformance] = useState<{
    users: Array<{
      user_id: string; full_name: string; email: string;
      department_name: string; total_tasks: number;
      completed_tasks: number; in_progress_tasks: number;
      overdue_tasks: number; completion_rate: number;
    }>;
  }>({ users: [] });
  const [loading, setLoading] = useState(true);

  /* ── unchanged data-fetching logic ── */
  useEffect(() => {
    if (!user || !role) return;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('b1g_token');
        const [statsResponse, chartResponse, performanceResponse] = await Promise.all([
          fetch(`${API_BASE}/data/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          fetch(`${API_BASE}/data/dashboard/chart-data`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          ...(role === 'admin' || role === 'manager'
            ? [fetch(`${API_BASE}/data/dashboard/user-performance`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              })]
            : []),
        ]);

        if (statsResponse.ok && chartResponse.ok) {
          const statsData = await statsResponse.json();
          const chartData = await chartResponse.json();
          const performanceData = performanceResponse && performanceResponse.ok
            ? await performanceResponse.json() : null;

          setStats({
            total: statsData.data.total,
            inProgress: statsData.data.inProgress,
            completed: statsData.data.completed,
            departments: statsData.data.departments,
            overdue: statsData.data.overdue,
            underReview: statsData.data.underReview,
          });
          setDeptChart(chartData.data.deptChart);
          setTrendChart(chartData.data.trendChart);
          if (performanceData) setUserPerformance(performanceData.data);
        } else {
          setStats({ total: 0, inProgress: 0, completed: 0, departments: 0, overdue: 0, underReview: 0 });
          setDeptChart([]);
          setTrendChart([]);
          setUserPerformance({ users: [] });
        }
      } catch {
        setStats({ total: 0, inProgress: 0, completed: 0, departments: 0, overdue: 0, underReview: 0 });
        setDeptChart([]);
        setTrendChart([]);
        setUserPerformance({ users: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, role]);

  /* ── label helpers ── */
  const getTitle = () =>
    role === 'admin' ? 'Admin Dashboard'
    : role === 'manager' ? 'Manager Dashboard'
    : 'My Dashboard';

  const getSubtitle = () =>
    role === 'admin' ? 'Overview of all departments, tasks and progress'
    : role === 'manager' ? 'Overview of your department tasks and team progress'
    : 'Overview of your assigned tasks and progress';

  const getChartTitle = () =>
    role === 'admin' ? 'Tasks by Department'
    : role === 'manager' ? 'Task Distribution'
    : 'My Task Status';

  /* ── fourth stat pill ── */
  const fourthStat = role === 'admin'
    ? { label: 'Departments', value: stats.departments, icon: Building2, accent: 'bg-violet-400', darkAccent: 'bg-violet-500' }
    : role === 'manager'
    ? { label: 'Under Review', value: stats.underReview, icon: Eye, accent: 'bg-cyan-400', darkAccent: 'bg-cyan-500' }
    : { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, accent: 'bg-rose-400', darkAccent: 'bg-rose-500' };

  /* ── completion % for mini arc ── */
  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <AppLayout>
      <div className="relative min-h-screen space-y-7 px-1 pb-12 animate-fade-in">

        {/* ── Ambient background blobs (light + dark) ── */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-violet-300/20 dark:bg-violet-700/10 blur-3xl" />
          <div className="absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-cyan-300/20 dark:bg-cyan-700/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-indigo-300/15 dark:bg-indigo-700/10 blur-3xl" />
        </div>

        {/* ── Page header ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {getTitle()}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getSubtitle()}</p>
          </div>

          {/* Completion ring */}
          <div className="hidden sm:flex flex-col items-center gap-1">
            <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" strokeWidth="5"
                className="stroke-slate-100 dark:stroke-white/10" />
              <circle cx="28" cy="28" r="22" fill="none" strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - completionPct / 100)}`}
                strokeLinecap="round"
                className="stroke-violet-500 dark:stroke-violet-400 transition-all duration-700" />
            </svg>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {completionPct}% done
            </p>
          </div>
        </div>

        {/* ── Stat pills row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill label="Total Tasks"  value={stats.total}      icon={ListTodo}     accent="bg-indigo-400"  darkAccent="bg-indigo-500"  delay={0}   />
          <StatPill label="In Progress"  value={stats.inProgress} icon={Activity}     accent="bg-amber-400"  darkAccent="bg-amber-500"  delay={80}  />
          <StatPill label="Completed"    value={stats.completed}  icon={CheckCircle2} accent="bg-emerald-400" darkAccent="bg-emerald-500" delay={160} />
          <StatPill label={fourthStat.label} value={fourthStat.value} icon={fourthStat.icon}
                    accent={fourthStat.accent} darkAccent={fourthStat.darkAccent} delay={240} />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Tasks by Dept bar chart */}
          <div className="rounded-2xl border border-slate-200/70 dark:border-white/10
                          bg-white/80 dark:bg-white/5 backdrop-blur-md shadow-sm p-5
                          hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Chart</p>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">{getChartTitle()}</h2>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                <Zap className="h-3 w-3" /> Live
              </span>
            </div>

            {deptChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={deptChart} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(262,83%,58%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(240,80%,70%)" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'currentColor' }}
                    axisLine={false} tickLine={false} className="text-slate-400 dark:text-slate-500" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'currentColor' }}
                    axisLine={false} tickLine={false} width={24} className="text-slate-400 dark:text-slate-500" />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                  <Bar dataKey="tasks" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[210px] items-center justify-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {loading ? 'Loading data…' : 'No data yet'}
                </p>
              </div>
            )}
          </div>

          {/* Completion trend area chart */}
          <div className="rounded-2xl border border-slate-200/70 dark:border-white/10
                          bg-white/80 dark:bg-white/5 backdrop-blur-md shadow-sm p-5
                          hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Trend</p>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Completion Trend</h2>
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>

            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trendChart}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(262,83%,58%)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(262,83%,58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                  className="text-slate-400 dark:text-slate-500" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                  width={24} className="text-slate-400 dark:text-slate-500" />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.3)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="completed" stroke="hsl(262,83%,58%)" strokeWidth={2.5}
                  fill="url(#areaGrad)" dot={{ r: 3.5, fill: 'hsl(262,83%,58%)', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: 'hsl(262,83%,58%)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bottom cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Overdue tasks */}
          <button
            onClick={() => navigate('/tracker?filter=overdue')}
            className="group text-left rounded-2xl border border-slate-200/70 dark:border-white/10
                       bg-white/80 dark:bg-white/5 backdrop-blur-md shadow-sm p-5
                       hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 w-full"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                  Attention needed
                </p>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Overdue Tasks</h2>
              </div>
              <span className={`flex items-center justify-center h-9 w-9 rounded-xl
                ${stats.overdue > 0 ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
                <AlertTriangle className={`h-4 w-4 ${stats.overdue > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
              </span>
            </div>

            <div className="mt-4">
              {stats.overdue === 0 ? (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    All caught up — no overdue tasks 🎉
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-black text-rose-500">{stats.overdue}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    task{stats.overdue !== 1 ? 's' : ''} past their due date
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400
                            group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              View in tracker <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* Users Performance */}
          <button
            onClick={() => navigate('/performance')}
            className="group text-left rounded-2xl border border-slate-200/70 dark:border-white/10
                       bg-white/80 dark:bg-white/5 backdrop-blur-md shadow-sm p-5
                       hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 w-full relative overflow-hidden"
          >
            {/* Decorative stripe */}
            <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-2xl bg-gradient-to-b from-violet-500 to-indigo-500 opacity-60" />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                  Analytics
                </p>
                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-500" />
                  Users Performance
                </h2>
              </div>
              <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-500/10">
                <Activity className="h-4 w-4 text-violet-500" />
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              View detailed completion rates and task metrics for every team member.
            </p>

            {/* Mini progress bars for first 3 users */}
            {userPerformance.users.length > 0 && (
              <div className="mt-4 space-y-2">
                {userPerformance.users.slice(0, 3).map((u) => (
                  <div key={u.user_id} className="flex items-center gap-2">
                    <p className="w-20 truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {u.full_name?.split(' ')[0] ?? 'User'}
                    </p>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-700"
                        style={{ width: `${Math.min(u.completion_rate, 100)}%` }}
                      />
                    </div>
                    <p className="w-8 text-right text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {Math.round(u.completion_rate)}%
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400
                            group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" /> View full report
            </div>
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;