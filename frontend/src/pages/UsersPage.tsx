import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { getMockUsers, getMockDepartments } from '@/lib/mockData';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

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
  department_ids?: string[]; // For managers with multiple departments
  department_names?: string[]; // For displaying multiple departments
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<DisplayUser | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<AppRole>('user');
  const [formDept, setFormDept] = useState('');
  const [formDeptIds, setFormDeptIds] = useState<string[]>([]); // For multiple department selection

  const fetchAll = async () => {
    // Use hardcoded mock data
    const mockUsers = getMockUsers();
    const mockDepartments = getMockDepartments();
    setUsers(mockUsers);
    setDepartments(mockDepartments);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setFormDept('');
    setFormDeptIds([]);
    setDialogOpen(true);
  };

  const openEdit = (u: DisplayUser) => {
    setEditUser(u);
    setFormName(u.full_name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormRole(u.role);
    setFormDept(u.department_id);
    // Set department IDs for managers with multiple departments
    setFormDeptIds(u.department_ids || (u.department_id ? [u.department_id] : []));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formName.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    if (!editUser && !formEmail.trim()) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
      return;
    }
    if ((formRole === 'manager' || formRole === 'user') && formDeptIds.length === 0) {
      toast({ title: 'Error', description: `At least one department must be selected for ${formRole} role`, variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      if (editUser) {
        // Mock update - just show success toast
        const selectedDeptNames = formDeptIds.map(id => departments.find(d => d.id === id)?.name).filter(Boolean);
        const deptDisplay = selectedDeptNames.length > 0 ? ` · ${selectedDeptNames.join(', ')}` : '';
        
        // Update user in state
        setUsers(prev => prev.map(u =>
          u.user_id === editUser.user_id
            ? { 
                ...u, 
                full_name: formName, 
                role: formRole, 
                department_id: formDeptIds[0] || '',
                department_name: selectedDeptNames[0] || '',
                department_ids: formDeptIds,
                department_names: selectedDeptNames as string[]
              }
            : u
        ));
        toast({ title: `✅ ${formName} updated to ${formRole}${deptDisplay}` });
      } else {
        // Mock create - just show success toast
        const selectedDeptNames = formDeptIds.map(id => departments.find(d => d.id === id)?.name).filter(Boolean);
        const newUser: DisplayUser = {
          id: Date.now().toString(),
          user_id: Date.now().toString(),
          full_name: formName,
          email: formEmail,
          avatar_url: null,
          role: formRole,
          department_id: formDeptIds[0] || '',
          department_name: selectedDeptNames[0] || '',
          department_ids: formDeptIds,
          department_names: selectedDeptNames as string[]
        };
        setUsers(prev => [newUser, ...prev]);
        toast({ title: `✅ User ${formName} created as ${formRole}`, description: 'Default password: Password123!' });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDelete = async (u: DisplayUser) => {
    setUserToDelete(u);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userToDelete.user_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Delete failed');
      }
      setUsers(prev => prev.filter(x => x.user_id !== userToDelete.user_id));
      toast({ title: `🗑️ ${userToDelete.full_name} deleted` });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
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
                      {u.department_names && u.department_names.length > 0 
                        ? u.department_names.join(', ') 
                        : u.department_name || '—'
                      }
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUser ? 'Edit User' : 'Create User'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Juan Dela Cruz" />
              </div>
              {!editUser && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="you@company.com" />
                  <p className="text-xs text-muted-foreground">Default password will be: password123</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={(v: AppRole) => {
                  console.log('Role changed to:', v);
                  setFormRole(v);
                  // Reset department selection when role changes
                  setFormDeptIds([]);
                  setFormDept('');
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department{(formRole === 'manager' || formRole === 'user') ? 's' : ''}</Label>
                {(formRole === 'manager' || formRole === 'user') ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {departments.map(d => (
                      <div key={d.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${d.id}`}
                          checked={formDeptIds.includes(d.id)}
                          onCheckedChange={(checked) => {
                            console.log('Checkbox changed:', d.id, checked);
                            if (checked) {
                              setFormDeptIds(prev => [...prev, d.id]);
                            } else {
                              setFormDeptIds(prev => prev.filter(id => id !== d.id));
                            }
                          }}
                        />
                        <Label htmlFor={`dept-${d.id}`} className="text-sm font-normal cursor-pointer">
                          {d.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Select value={formDept} onValueChange={(value) => {
                    setFormDept(value);
                    setFormDeptIds(value ? [value] : []);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {(formRole === 'manager' || formRole === 'user') && formDeptIds.length === 0 && (
                  <p className="text-xs text-muted-foreground">Select at least one department for {formRole} role</p>
                )}
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete user <span className="font-semibold text-foreground">{userToDelete?.full_name}</span>?
              </p>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. The user will be permanently removed from the system.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
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
