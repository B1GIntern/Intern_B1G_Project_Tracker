import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, Clock, CheckCircle2, Building2, AlertTriangle, Eye, ExternalLink, Users, ArrowLeft, TrendingUp, Target, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
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

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
  department: string;
  avatar?: string;
}

interface UserPerformance {
  user: User;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  performanceScore: number;
}

type ViewType = 'dashboard' | 'users-list' | 'user-detail';

const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedUser, setSelectedUser] = useState<UserPerformance | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    departments: 0,
    overdue: 0,
    underReview: 0,
  });
  const [deptChart, setDeptChart] = useState<{ name: string; tasks: number }[]>([]);
  const [trendChart, setTrendChart] = useState<{ date: string; completed: number }[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userPerformances, setUserPerformances] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  useEffect(() => {
    if (!user || !role) return;
    
    // Hardcoded dashboard data for demo
    const mockStats: DashboardStats = {
      total: role === 'admin' ? 156 : role === 'manager' ? 42 : 18,
      inProgress: role === 'admin' ? 67 : role === 'manager' ? 23 : 8,
      completed: role === 'admin' ? 78 : role === 'manager' ? 15 : 9,
      departments: role === 'admin' ? 5 : 0,
      overdue: role === 'admin' ? 8 : role === 'manager' ? 3 : 1,
      underReview: role === 'admin' ? 12 : role === 'manager' ? 4 : 0,
    };

    const mockDeptChart = role === 'admin' ? [
      { name: 'Engineering', tasks: 45 },
      { name: 'Marketing', tasks: 32 },
      { name: 'Sales', tasks: 28 },
      { name: 'HR', tasks: 18 },
      { name: 'Finance', tasks: 33 },
    ] : role === 'manager' ? [
      { name: 'In Progress', tasks: 23 },
      { name: 'Completed', tasks: 15 },
      { name: 'Review', tasks: 4 },
    ] : [
      { name: 'In Progress', tasks: 8 },
      { name: 'Completed', tasks: 9 },
      { name: 'Overdue', tasks: 1 },
    ];

    const mockTrendChart = [
      { date: 'Mon', completed: 12 },
      { date: 'Tue', completed: 15 },
      { date: 'Wed', completed: 8 },
      { date: 'Thu', completed: 22 },
      { date: 'Fri', completed: 18 },
      { date: 'Sat', completed: 6 },
      { date: 'Sun', completed: 3 },
    ];

    // Mock users data
    const mockUsers: User[] = [
      { id: '1', name: 'John Smith', email: 'john@company.com', role: 'admin', department: 'Engineering' },
      { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'manager', department: 'Marketing' },
      { id: '3', name: 'Mike Chen', email: 'mike@company.com', role: 'manager', department: 'Engineering' },
      { id: '4', name: 'Emily Davis', email: 'emily@company.com', role: 'user', department: 'Sales' },
      { id: '5', name: 'Alex Wilson', email: 'alex@company.com', role: 'user', department: 'Finance' },
      { id: '6', name: 'Lisa Brown', email: 'lisa@company.com', role: 'manager', department: 'HR' },
      { id: '7', name: 'Tom Martinez', email: 'tom@company.com', role: 'user', department: 'Engineering' },
      { id: '8', name: 'Jessica Lee', email: 'jessica@company.com', role: 'user', department: 'Marketing' },
    ];

    // Mock user performance data
    const mockUserPerformances: UserPerformance[] = [
      {
        user: mockUsers[0],
        totalTasks: 45,
        completedTasks: 38,
        inProgressTasks: 5,
        overdueTasks: 2,
        completionRate: 84,
        avgCompletionTime: 2.5,
        performanceScore: 92
      },
      {
        user: mockUsers[1],
        totalTasks: 32,
        completedTasks: 28,
        inProgressTasks: 3,
        overdueTasks: 1,
        completionRate: 88,
        avgCompletionTime: 2.1,
        performanceScore: 89
      },
      {
        user: mockUsers[2],
        totalTasks: 38,
        completedTasks: 32,
        inProgressTasks: 4,
        overdueTasks: 2,
        completionRate: 84,
        avgCompletionTime: 2.8,
        performanceScore: 85
      },
      {
        user: mockUsers[3],
        totalTasks: 28,
        completedTasks: 25,
        inProgressTasks: 2,
        overdueTasks: 1,
        completionRate: 89,
        avgCompletionTime: 1.9,
        performanceScore: 88
      },
      {
        user: mockUsers[4],
        totalTasks: 25,
        completedTasks: 22,
        inProgressTasks: 2,
        overdueTasks: 1,
        completionRate: 88,
        avgCompletionTime: 2.2,
        performanceScore: 86
      },
      {
        user: mockUsers[5],
        totalTasks: 18,
        completedTasks: 16,
        inProgressTasks: 1,
        overdueTasks: 1,
        completionRate: 89,
        avgCompletionTime: 1.8,
        performanceScore: 87
      },
      {
        user: mockUsers[6],
        totalTasks: 22,
        completedTasks: 18,
        inProgressTasks: 3,
        overdueTasks: 1,
        completionRate: 82,
        avgCompletionTime: 3.1,
        performanceScore: 83
      },
      {
        user: mockUsers[7],
        totalTasks: 20,
        completedTasks: 17,
        inProgressTasks: 2,
        overdueTasks: 1,
        completionRate: 85,
        avgCompletionTime: 2.4,
        performanceScore: 84
      },
    ];

    setStats(mockStats);
    setDeptChart(mockDeptChart);
    setTrendChart(mockTrendChart);
    setUsers(mockUsers);
    setUserPerformances(mockUserPerformances);
    setLoading(false);
  }, [user, role]);

  const getTitle = () => {
    switch (role) {
      case 'admin': return 'Admin Dashboard';
      case 'manager': return 'Manager Dashboard';
      default: return 'My Dashboard';
    }
  };

  const getSubtitle = () => {
    switch (role) {
      case 'admin': return 'Overview of all departments, tasks and progress';
      case 'manager': return 'Overview of your department tasks and team progress';
      default: return 'Overview of your assigned tasks and progress';
    }
  };

  const getChartTitle = () => {
    switch (role) {
      case 'admin': return 'Tasks by Department';
      case 'manager': return 'Task Distribution';
      default: return 'My Task Status';
    }
  };

  const handleUserClick = (userPerformance: UserPerformance) => {
    setSelectedUser(userPerformance);
    setCurrentView('user-detail');
  };

  const handleBack = () => {
    if (currentView === 'user-detail') {
      setCurrentView('users-list');
      setSelectedUser(null);
    } else {
      setCurrentView('dashboard');
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 capitalize font-semibold bg-violet-100 text-violet-700 border border-violet-200';
      case 'manager': return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 capitalize font-semibold bg-blue-100 text-blue-800 border border-blue-200';
      case 'user': return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 capitalize font-semibold bg-green-100 text-green-800 border border-green-200';
      default: return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 capitalize font-semibold bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Pagination calculations
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = userPerformances.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(userPerformances.length / usersPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {currentView === 'dashboard' && (
          <>
            <div>
              <h1 className="text-2xl font-display font-bold">{getTitle()}</h1>
              <p className="text-muted-foreground">{getSubtitle()}</p>
            </div>

            {/* Stats Cards */}
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
              {/* Tasks by Department / Status Distribution */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display">{getChartTitle()}</CardTitle>
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
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      {loading ? 'Loading...' : 'No data yet'}
                    </p>
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
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="hsl(262, 83%, 58%)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Overdue Tasks */}
              <Card className="border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tracker?filter=overdue')}>
                <CardHeader>
                  <CardTitle className="text-lg font-display text-left">Overdue Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.overdue === 0 ? (
                    <p className="text-muted-foreground text-sm">No overdue tasks 🎉</p>
                  ) : (
                    <p className="text-sm text-destructive font-medium">
                      {stats.overdue} task(s) past due date
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Users Performance Card */}
              {(role === 'admin' || role === 'manager') && (
                <Card className="border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('users-list')}>
                  <CardHeader>
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Users Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      View performance metrics for all team members
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Track team productivity</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              </div>
          </>
        )}

        {currentView === 'users-list' && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-display font-bold">Users Performance</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentUsers.map((userPerf) => (
                <Card 
                  key={userPerf.user.id} 
                  className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleUserClick(userPerf)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-display">{userPerf.user.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={getRoleColor(userPerf.user.role)}>
                        {userPerf.user.role}
                      </span>
                      <span className="text-xs">{userPerf.user.department}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Performance Score</span>
                      <span className={`text-2xl font-bold ${getPerformanceColor(userPerf.performanceScore)}`}>
                        {userPerf.performanceScore}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Tasks</p>
                        <p className="font-medium">{userPerf.totalTasks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completion Rate</p>
                        <p className="font-medium">{userPerf.completionRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">In Progress</p>
                        <p className="font-medium">{userPerf.inProgressTasks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Overdue</p>
                        <p className="font-medium text-destructive">{userPerf.overdueTasks}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Avg Completion Time</span>
                      <span>{userPerf.avgCompletionTime} days</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {currentView === 'user-detail' && selectedUser && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Users
              </Button>
              <h1 className="text-2xl font-display font-bold">{selectedUser.user.name} - Performance</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">{selectedUser.performanceScore}</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedUser.performanceScore >= 90 ? 'bg-green-100 text-green-800' :
                      selectedUser.performanceScore >= 80 ? 'bg-blue-100 text-blue-800' :
                      selectedUser.performanceScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.performanceScore >= 90 ? 'Excellent' :
                       selectedUser.performanceScore >= 80 ? 'Good' :
                       selectedUser.performanceScore >= 70 ? 'Average' : 'Needs Improvement'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Tasks</span>
                      <span className="font-medium">{selectedUser.totalTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium text-green-600">{selectedUser.completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">In Progress</span>
                      <span className="font-medium text-blue-600">{selectedUser.inProgressTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overdue</span>
                      <span className="font-medium text-red-600">{selectedUser.overdueTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-medium">{selectedUser.completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Completion Time</span>
                      <span className="font-medium">{selectedUser.avgCompletionTime} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    User Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{selectedUser.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{selectedUser.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium capitalize">{selectedUser.user.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">{selectedUser.user.department}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
