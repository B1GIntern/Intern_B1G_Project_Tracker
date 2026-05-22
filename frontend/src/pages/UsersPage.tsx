import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Trash2, AlertTriangle, Users,
  ChevronLeft, ChevronRight, Eye, EyeOff, Search,
  ShieldCheck, Briefcase, UserRound, X,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type AppRole = 'admin' | 'manager' | 'employee';

interface DisplayUser {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: AppRole;
  department_id: string | null;
  department_name: string | null;
}

interface Department {
  id: string;
  name: string;
}

/* ── Role badge config ── */
const ROLE_CONFIG: Record<AppRole, { label: string; classes: string; darkClasses: string; icon: React.ElementType; dot: string }> = {
  admin: {
    label: 'Admin',
    classes: 'bg-violet-100 text-violet-700 border border-violet-200',
    darkClasses: 'dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
    icon: ShieldCheck,
    dot: 'bg-violet-500',
  },
  manager: {
    label: 'Manager',
    classes: 'bg-blue-100 text-blue-700 border border-blue-200',
    darkClasses: 'dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    icon: Briefcase,
    dot: 'bg-blue-500',
  },
  employee: {
    label: 'Employee',
    classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    darkClasses: 'dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    icon: UserRound,
    dot: 'bg-emerald-500',
  },
};

/* ── Avatar initials ── */
function UserAvatar({ name, role }: { name: string; role: AppRole }) {
  const initials = (name ?? '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const bg: Record<AppRole, string> = {
    admin: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
    manager: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    employee: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  };
  return (
    <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${bg[role]}`}>
      {initials}
    </div>
  );
}

/* ── Role badge ── */
function RoleBadge({ role }: { role: AppRole }) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600">
        {role || 'Unknown'}
      </span>
    );
  }
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.classes} ${cfg.darkClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   Main UsersPage
══════════════════════════════════════════════════════ */
const UsersPage = () => {
  const { role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<DisplayUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<DisplayUser | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(7);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<AppRole | ''>('');
  const [formDept, setFormDept] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /* ── filtering ── */
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const sl = searchTerm.toLowerCase().trim();
    return users.filter(u =>
      u.full_name.toLowerCase().includes(sl) ||
      u.email.toLowerCase().includes(sl) ||
      u.role.toLowerCase().includes(sl) ||
      (u.department_name && u.department_name.toLowerCase().includes(sl))
    );
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  useEffect(() => { setSearchTerm(''); setCurrentPage(1); }, [users]);

  /* ── data fetch (unchanged logic) ── */
  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('b1g_token');
      if (!token) return;
      const [usersRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE}/users`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }),
        fetch(`${API_BASE}/departments`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }),
      ]);
      if (!usersRes.ok) {
        if (usersRes.status === 401) {
          toast({ title: 'Unauthorized', description: 'Session expired. Please log in again.', variant: 'destructive' });
          localStorage.removeItem('b1g_token'); localStorage.removeItem('b1g_user'); return;
        }
        throw new Error(`Failed to fetch users: ${usersRes.status}`);
      }
      if (!deptsRes.ok) throw new Error(`Failed to fetch departments: ${deptsRes.status}`);
      const usersData = await usersRes.json();
      const deptsData = await deptsRes.json();
      setUsers(usersData.data || []);
      setTotalUsers((usersData.data || []).length);
      setDepartments(deptsData.data || []);
      setCurrentPage(1);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  useEffect(() => { if (!authLoading && role === 'admin') fetchAll(); }, [role, authLoading]);

  const openCreate = () => {
    setEditUser(null); setFormName(''); setFormEmail('');
    setFormPassword(''); setFormRole(''); setFormDept(''); setDialogOpen(true);
  };

  const openEdit = (u: DisplayUser) => {
    setEditUser(u); setFormName(u.full_name); setFormEmail(u.email);
    setFormPassword(''); setFormRole(u.role); setFormDept(u.department_id || ''); setDialogOpen(true);
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!formName.trim()) errors.push('Full Name is required');
    if (!editUser && !formEmail.trim()) errors.push('Email is required');
    else if (!editUser && formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) errors.push('Invalid email address');
    if (!editUser && !formPassword.trim()) errors.push('Password is required');
    else if (!editUser && formPassword.trim()) {
      if (formPassword.length < 8) errors.push('Password must be at least 8 characters');
      if (!/(?=.*[a-z])/.test(formPassword)) errors.push('Password must contain a lowercase letter');
      if (!/(?=.*[A-Z])/.test(formPassword)) errors.push('Password must contain an uppercase letter');
      if (!/(?=.*\d)/.test(formPassword)) errors.push('Password must contain a number');
    }
    if (!formRole) errors.push('Role is required');
    if (!formDept) errors.push('Department is required');
    if (errors.length > 0) { toast({ title: 'Validation Error', description: errors.join(', '), variant: 'destructive' }); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('b1g_token');
      if (editUser) {
        const updateData: any = { full_name: formName };
        if (formRole !== editUser.role) updateData.role = formRole;
        if (formDept !== editUser.department_id) updateData.department_id = formDept || null;
        const res = await fetch(`${API_BASE}/users/${editUser.user_id}`, {
          method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Update failed'); }
        toast({ title: `✅ ${formName} updated successfully` });
        await fetchAll();
      } else {
        const res = await fetch(`${API_BASE}/users`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: formName, email: formEmail, password: formPassword, role: formRole, department_id: formDept || null }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Create failed'); }
        toast({ title: `✅ User ${formName} created as ${formRole}`, description: `Password: ${formPassword}` });
      }
      setDialogOpen(false); fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDelete = (u: DisplayUser) => { setUserToDelete(u); setDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem('b1g_token');
      const res = await fetch(`${API_BASE}/users/${userToDelete.user_id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Delete failed'); }
      toast({ title: `🗑️ ${userToDelete.full_name} deleted` });
      setDeleteDialogOpen(false); setUserToDelete(null); fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  /* ── Role breakdown counts ── */
  const roleCounts = useMemo(() => ({
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    employee: users.filter(u => u.role === 'employee').length,
  }), [users]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">Loading…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <ShieldCheck className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Access denied. Admin only.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="relative space-y-6 animate-fade-in pb-12">

        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-violet-300/10 dark:bg-violet-700/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-blue-300/10 dark:bg-blue-700/8 blur-3xl" />
        </div>

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-violet-500" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
                Administration
              </p>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              User Management
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {totalUsers} member{totalUsers !== 1 ? 's' : ''} across all departments
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-500
                       dark:hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20
                       hover:shadow-violet-500/30 transition-all duration-200 font-semibold"
          >
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>

        {/* ── Role stat pills ── */}
        <div className="grid grid-cols-3 gap-3">
          {(['admin', 'manager', 'employee'] as AppRole[]).map(r => {
            const cfg = ROLE_CONFIG[r];
            const Icon = cfg.icon;
            return (
              <div
                key={r}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/70 dark:border-white/10
                           bg-white/80 dark:bg-white/5 backdrop-blur-md px-4 py-3 shadow-sm"
              >
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 capitalize">{r}</p>
                  <p className="text-xl font-black tabular-nums text-slate-800 dark:text-white leading-none">
                    {roleCounts[r]}
                  </p>
                </div>
                <Icon className="ml-auto h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
              </div>
            );
          })}
        </div>

        {/* ── Search bar ── */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, role or department…"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-9 h-10 rounded-xl border-slate-200 dark:border-white/10
                       bg-white/80 dark:bg-white/5 backdrop-blur-sm text-sm
                       focus:ring-violet-500/30 focus:border-violet-400"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full
                         flex items-center justify-center bg-slate-200 dark:bg-slate-700
                         hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              <X className="h-3 w-3 text-slate-500 dark:text-slate-400" />
            </button>
          )}
        </div>

        {/* ── Users table ── */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-white/10
                        bg-white/80 dark:bg-white/5 backdrop-blur-md shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 dark:border-white/8 hover:bg-transparent">
                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-5">
                  User
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Role
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Department
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.map((user, i) => (
                <TableRow
                  key={user.user_id}
                  className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/80
                             dark:hover:bg-white/5 transition-colors duration-150 group"
                >
                  <TableCell className="pl-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.full_name} role={user.role} />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">{user.full_name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className="py-3.5">
                    {user.department_name ? (
                      <span className="text-sm text-slate-600 dark:text-slate-300">{user.department_name}</span>
                    ) : (
                      <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => openEdit(user)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center
                                   bg-slate-100 dark:bg-white/10 hover:bg-violet-100 dark:hover:bg-violet-500/20
                                   text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300
                                   transition-all duration-150"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center
                                     bg-slate-100 dark:bg-white/10 hover:bg-rose-100 dark:hover:bg-rose-500/20
                                     text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400
                                     transition-all duration-150"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {currentUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-slate-200 dark:text-slate-700" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        {searchTerm ? 'No users match your search' : 'No users yet'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        {totalUsers > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 dark:border-white/10
                          bg-white/70 dark:bg-white/5 backdrop-blur-md px-5 py-3 shadow-sm">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{startIndex + 1}–{Math.min(endIndex, filteredUsers.length)}</span> of{' '}
              <span className="font-semibold text-slate-600 dark:text-slate-300">{filteredUsers.length}</span> users
              {searchTerm && <span className="text-slate-300 dark:text-slate-600"> · {totalUsers - filteredUsers.length} filtered</span>}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200
                           dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400
                           hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-150"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all duration-150
                    ${currentPage === page
                      ? 'bg-violet-600 dark:bg-violet-500 text-white shadow-md shadow-violet-500/25'
                      : 'border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200
                           dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400
                           hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-150"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Add / Edit Dialog ── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                {editUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {editUser ? 'Update user details and permissions' : 'Create a new user account'}
              </p>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Full Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Enter full name"
                  className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-violet-500/30"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Email <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="Enter email address"
                  disabled={!!editUser}
                  className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-violet-500/30 disabled:opacity-50"
                />
              </div>

              {/* Password */}
              {!editUser && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars, upper, lower, number"
                      className="pr-10 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-violet-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Role <span className="text-rose-500">*</span>
                </Label>
                <Select value={formRole} onValueChange={(v: AppRole | '') => setFormRole(v)}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Department <span className="text-rose-500">*</span>
                </Label>
                <Select value={formDept || undefined} onValueChange={setFormDept}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl border-slate-200 dark:border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600
                           text-white shadow-md shadow-violet-500/20 font-semibold"
              >
                {loading
                  ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</span>
                  : editUser ? 'Save Changes' : 'Create User'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirmation Dialog ── */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                </div>
                <DialogTitle className="text-base font-black text-slate-900 dark:text-white">
                  Delete User
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-2 py-1">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-800 dark:text-white">{userToDelete?.full_name}</span>?
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                This action cannot be undone. The user will be permanently removed from the system.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => { setDeleteDialogOpen(false); setUserToDelete(null); }}
                className="rounded-xl border-slate-200 dark:border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 font-semibold"
              >
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default UsersPage;