import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, Clock, CheckCircle2, Building2, AlertTriangle } from 'lucide-react';

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

  useEffect(() => {
    const fetchStats = async () => {
      const [tasksRes, deptRes] = await Promise.all([
        supabase.from('tasks').select('status, due_date'),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
      ]);

      const tasks = tasksRes.data || [];
      const now = new Date();

      setStats({
        total: tasks.length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        departments: deptRes.count || 0,
        overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length,
        underReview: tasks.filter(t => t.status === 'under_review').length,
      });
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
          ) : (
            <StatsCard title="Under Review" value={stats.underReview} icon={AlertTriangle} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
