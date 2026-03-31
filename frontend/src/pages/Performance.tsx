import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface UserPerformance {
  user_id: string;
  full_name: string;
  email: string;
  department_name: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: string; // Coming as string from backend
  avg_progress: string;   // Coming as string from backend
}

const Performance = () => {
  const { user, role } = useAuth();
  const [performanceData, setPerformanceData] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !role) return;
    
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('b1g_token');
        
        // For Employee role, fetch only their individual performance
        // For Admin/Manager, fetch all users performance
        const endpoint = role === 'employee' 
          ? `${API_BASE}/data/dashboard/user-performance?userId=${user?.id}`
          : `${API_BASE}/data/dashboard/user-performance`;
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPerformanceData(data.data.users || []);
        } else {
          console.error('Failed to fetch performance data');
        }
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [user, role]);

  const getPerformanceColor = (rate: string) => {
    const numericRate = parseFloat(rate);
    if (numericRate >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (numericRate >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getPerformanceLabel = (rate: string) => {
    const numericRate = parseFloat(rate);
    if (numericRate >= 80) return 'Completed';
    if (numericRate >= 60) return 'Good';
    return 'Not Done';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">
            {role === 'employee' ? 'My Performance' : 'User Performance'}
          </h1>
          <p className="text-muted-foreground">
            {role === 'employee' 
              ? 'Track your individual performance metrics based on task completion and progress'
              : 'Track performance metrics for all team members based on task completion and progress'
            }
          </p>
        </div>

        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold">{performanceData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Avg Completion</p>
                  <p className="text-2xl font-bold">
                    {performanceData.length > 0 
                      ? Math.round(performanceData.reduce((acc, user) => acc + parseFloat(user.completion_rate), 0) / performanceData.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">In Progress</p>
                  <p className="text-2xl font-bold">
                    {performanceData.reduce((acc, user) => acc + user.in_progress_tasks, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Overdue Tasks</p>
                  <p className="text-2xl font-bold">
                    {performanceData.reduce((acc, user) => acc + user.overdue_tasks, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Performance List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Individual Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No performance data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {performanceData.map((user) => (
                  <div key={user.user_id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{user.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.department_name && (
                            <p className="text-xs text-muted-foreground">{user.department_name}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={getPerformanceColor(user.completion_rate)}>
                        {getPerformanceLabel(user.completion_rate)}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Task Completion Rate</span>
                        <span className="text-sm font-bold">{user.completion_rate}%</span>
                      </div>
                      <Progress value={parseFloat(user.completion_rate)} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Average Task Progress</span>
                        <span className="text-sm font-bold">
                          {user.avg_progress ? parseFloat(user.avg_progress).toFixed(2) : '0.00'}%
                        </span>
                      </div>
                      <Progress value={user.avg_progress ? parseFloat(user.avg_progress) : 0} className="h-2" />
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-blue-600">{user.total_tasks}</p>
                          <p className="text-muted-foreground text-xs">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-green-600">{user.completed_tasks}</p>
                          <p className="text-muted-foreground text-xs">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-yellow-600">{user.in_progress_tasks}</p>
                          <p className="text-muted-foreground text-xs">In Progress</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-red-600">{user.overdue_tasks}</p>
                          <p className="text-muted-foreground text-xs">Overdue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Performance;
