import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import UserAvatar from '@/components/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, Search, Pencil, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'manager' | 'user';
}

interface UserDepartment {
  user_id: string;
  department_id: string;
}

interface Department {
  id: string;
  name: string;
}

const UsersPage = () => {
  const { role } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [userDepts, setUserDepts] = useState<UserDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'manager' | 'user'>('user');
  const [formDept, setFormDept] = useState('');

  const fetchAll = async () => {
    const [usersRes, rolesRes, deptsRes, userDeptsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('departments').select('id, name'),
      supabase.from('user_departments').select('user_id, department_id'),
    ]);
    setUsers(usersRes.data || []);
    setRoles(rolesRes.data as UserRole[] || []);
    setDepartments(deptsRes.data || []);
    setUserDepts(userDeptsRes.data || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const getUserRole = (userId: string) => {
    const r = roles.find(r => r.user_id === userId);
    return r?.role || 'user';
  };

  const getUserDept = (userId: string) => {
    const ud = userDepts.find(d => d.user_id === userId);
    if (!ud) return null;
    return departments.find(d => d.id === ud.department_id);
  };

  const openCreate = () => {
    setEditUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setFormDept('');
    setDialogOpen(true);
  };

  const openEdit = (user: UserProfile) => {
    setEditUser(user);
    setFormName(user.full_name);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(getUserRole(user.user_id));
    const dept = getUserDept(user.user_id);
    setFormDept(dept?.id || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editUser) {
        // Update profile
        await supabase.from('profiles').update({ full_name: formName }).eq('user_id', editUser.user_id);
        // Update role
        await supabase.from('user_roles').update({ role: formRole }).eq('user_id', editUser.user_id);
        // Update department
        await supabase.from('user_departments').delete().eq('user_id', editUser.user_id);
        if (formDept) {
          await supabase.from('user_departments').insert({ user_id: editUser.user_id, department_id: formDept });
        }
        toast({ title: 'User updated successfully' });
      } else {
        // Create user via signup
        const { data, error } = await supabase.auth.signUp({
          email: formEmail,
          password: formPassword,
          options: { data: { full_name: formName } },
        });
        if (error) throw error;
        if (data.user) {
          // Update role (trigger creates default 'user' role)
          await supabase.from('user_roles').update({ role: formRole }).eq('user_id', data.user.id);
          if (formDept) {
            await supabase.from('user_departments').insert({ user_id: data.user.id, department_id: formDept });
          }
        }
        toast({ title: 'User created successfully' });
      }
      setDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`Delete user ${user.full_name}?`)) return;
    // Delete role, departments, then profile
    await supabase.from('user_roles').delete().eq('user_id', user.user_id);
    await supabase.from('user_departments').delete().eq('user_id', user.user_id);
    await supabase.from('profiles').delete().eq('user_id', user.user_id);
    toast({ title: 'User deleted' });
    fetchAll();
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
          <h1 className="text-2xl font-display font-bold">User Management</h1>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
                {filtered.map(user => {
                  const dept = getUserDept(user.user_id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar fullName={user.full_name} avatarUrl={user.avatar_url} size="sm" />
                          <span className="font-medium">{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{getUserRole(user.user_id)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{dept?.name || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUser ? 'Edit User' : 'Create User'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              {!editUser && (
                <>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} />
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
