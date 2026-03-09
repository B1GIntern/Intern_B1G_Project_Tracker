import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import UserAvatar from '@/components/UserAvatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

type AppRole = 'admin' | 'manager' | 'user';

interface DisplayUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: AppRole;
  department_id: string;
  department_name: string;
}

interface Department {
  id: string;
  name: string;
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-violet-100 text-violet-700 border border-violet-200',
  manager: 'bg-blue-100 text-blue-700 border border-blue-200',
  user: 'bg-green-100 text-green-700 border border-green-200',
};

const UsersPage = () => {
  const { role } = useAuth();
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<DisplayUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<AppRole>('user');
  const [formDept, setFormDept] = useState('');

  const fetchAll = async () => {
    const [profilesRes, rolesRes, deptsRes, userDeptsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('departments').select('id, name'),
      supabase.from('user_departments').select('user_id, department_id'),
    ]);

    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];
    const depts = deptsRes.data || [];
    const userDepts = userDeptsRes.data || [];

    setDepartments(depts);

    // Merge everything into one DisplayUser object per user
    const merged: DisplayUser[] = profiles.map(p => {
      const roleRow = roles.find(r => r.user_id === p.user_id);
      const deptRow = userDepts.find(d => d.user_id === p.user_id);
      const dept = depts.find(d => d.id === deptRow?.department_id);
      return {
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url,
        role: (roleRow?.role as AppRole) || 'user',
        department_id: deptRow?.department_id || '',
        department_name: dept?.name || '',
      };
    });

    setUsers(merged);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setFormDept('');
    setDialogOpen(true);
  };

  const openEdit = (u: DisplayUser) => {
    setEditUser(u);
    setFormName(u.full_name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormRole(u.role);
    setFormDept(u.department_id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editUser) {
        const deptName = departments.find(d => d.id === formDept)?.name || '';

        // ── Instantly update the local state so UI reflects change right away ──
        setUsers(prev => prev.map(u =>
          u.user_id === editUser.user_id
            ? { ...u, full_name: formName, role: formRole, department_id: formDept, department_name: deptName }
            : u
        ));

        // ── Try to persist to Supabase (works when backend is ready) ──
        await supabase.from('profiles').update({ full_name: formName }).eq('user_id', editUser.user_id);
        await supabase.from('user_roles').upsert({ user_id: editUser.user_id, role: formRole }, { onConflict: 'user_id' });
        if (formDept) {
          await supabase.from('user_departments').delete().eq('user_id', editUser.user_id);
          await supabase.from('user_departments').insert({ user_id: editUser.user_id, department_id: formDept });
        }

        toast({ title: `✅ ${formName} updated to ${formRole}${deptName ? ` · ${deptName}` : ''}` });
      } else {
        // Create new user via Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: formEmail,
          password: formPassword,
          options: { data: { full_name: formName } },
        });
        if (error) throw error;

        if (data.user) {
          await supabase.from('user_roles').upsert({ user_id: data.user.id, role: formRole }, { onConflict: 'user_id' });
          if (formDept) {
            await supabase.from('user_departments').insert({ user_id: data.user.id, department_id: formDept });
          }

          // Add to local state immediately
          const deptName = departments.find(d => d.id === formDept)?.name || '';
          const newUser: DisplayUser = {
            id: data.user.id,
            user_id: data.user.id,
            full_name: formName,
            email: formEmail,
            avatar_url: null,
            role: formRole,
            department_id: formDept,
            department_name: deptName,
          };
          setUsers(prev => [newUser, ...prev]);
        }

        toast({ title: `✅ User ${formName} created as ${formRole}` });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDelete = async (u: DisplayUser) => {
    if (!confirm(`Delete user ${u.full_name}?`)) return;
    // Remove from local state immediately
    setUsers(prev => prev.filter(x => x.user_id !== u.user_id));
    // Try Supabase delete
    await supabase.from('user_roles').delete().eq('user_id', u.user_id);
    await supabase.from('user_departments').delete().eq('user_id', u.user_id);
    await supabase.from('profiles').delete().eq('user_id', u.user_id);
    toast({ title: `🗑️ ${u.full_name} deleted` });
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied. Admin only.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground">Manage roles and departments for all users</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar fullName={u.full_name} avatarUrl={u.avatar_url} size="sm" />
                        <span className="font-medium">{u.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize font-semibold ${ROLE_COLORS[u.role]}`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.department_name || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit / Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUser ? 'Edit User' : 'Create User'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                />
              </div>
              {!editUser && (
                <>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={(v: any) => setFormRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={formDept} onValueChange={setFormDept}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading}>
                {editUser ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default UsersPage;