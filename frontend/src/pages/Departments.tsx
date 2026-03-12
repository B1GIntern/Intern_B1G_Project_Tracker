import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const Departments = () => {
  const { role } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`, { credentials: 'include' });
      if (!res.ok) return;
      setDepartments(await res.json());
    } catch {
      setDepartments([]);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openCreate = () => {
    setEditDept(null);
    setName('');
    setDescription('');
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditDept(dept);
    setName(dept.name);
    setDescription(dept.description || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const url = editDept ? `${API_BASE}/departments/${editDept.id}` : `${API_BASE}/departments`;
      const method = editDept ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Request failed');
      }

      toast({ title: editDept ? 'Department updated' : 'Department created' });
      setDialogOpen(false);
      fetchDepartments();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/departments/${dept.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Delete failed');
      }
      toast({ title: 'Department deleted' });
      fetchDepartments();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

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
          <h1 className="text-2xl font-display font-bold">Departments</h1>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Department
          </Button>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map(dept => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {dept.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{dept.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(dept)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(dept)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No departments yet
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
              <DialogTitle>{editDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. IT, HR, Sales" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Department description..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading}>
                {editDept ? 'Save Changes' : 'Create Department'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Departments;