import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, Clock, CheckCircle2, Building2, AlertTriangle, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    departments: 0,
    overdue: 0,
    underReview: 0,
  });
  const [deptChart, setDeptChart] = useState<{ name: string; tasks: number }[]>([]);
  const [trendChart, setTrendChart] = useState<{ date: string; completed: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [tasksRes, deptRes, deptsRes] = await Promise.all([
        supabase.from('tasks').select('status, due_date, department_id, created_at'),
        supabase.from('departments').select('id, name'),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
      ]);

      const tasks = tasksRes.data || [];
      const depts = deptRes.data || [];
      const now = new Date();

      setStats({
        total: tasks.length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        departments: deptsRes.count || 0,
        overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length,
        underReview: tasks.filter(t => t.status === 'under_review').length,
      });

      // Tasks by department chart
      const deptData = depts.map(d => ({
        name: d.name,
        tasks: tasks.filter(t => t.department_id === d.id).length,
      }));
      setDeptChart(deptData);

      // Completion trend (last 7 days)
      const trend: { date: string; completed: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        trend.push({
          date: d.toLocaleDateString('en', { weekday: 'short' }),
          completed: tasks.filter(t => t.status === 'completed' && t.created_at?.startsWith(dateStr)).length,
        });
      }
      setTrendChart(trend);
    };
    fetchStats();
  }, []);

  const getTitle = () => {
    switch (role) {
      case 'admin': return 'Admin Dashboard';
      case 'manager': return 'Manager Dashboard';
      default: return 'My Dashboard';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">{getTitle()}</h1>
          <p className="text-muted-foreground">Overview of your project tasks and progress</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Tasks" value={stats.total} icon={ListTodo} />
          <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} />
          <StatsCard title="Completed" value={stats.completed} icon={CheckCircle2} trend="up" />
          {role === 'admin' ? (
            <StatsCard title="Departments" value={stats.departments} icon={Building2} />
          ) : role === 'manager' ? (
            <StatsCard title="Under Review" value={stats.underReview} icon={Eye} />
          ) : (
            <StatsCard title="Overdue" value={stats.overdue} icon={AlertTriangle} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tasks by Department */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Tasks by Department</CardTitle>
            </CardHeader>
            <CardContent>
              {deptChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptChart}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No department data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Completion Trend */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Completion Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 90%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.overdue === 0 ? (
                <p className="text-muted-foreground text-sm">No overdue tasks 🎉</p>
              ) : (
                <p className="text-sm text-destructive font-medium">{stats.overdue} task(s) past due date</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="gradient-primary h-2 rounded-full transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-sm mt-3">
                <span className="text-muted-foreground">Under Review</span>
                <span className="font-medium">{stats.underReview}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
