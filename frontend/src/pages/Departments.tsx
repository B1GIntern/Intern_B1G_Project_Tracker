import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  Building2, Plus, Pencil, Trash2, AlertTriangle,
  Search, ShieldCheck, Briefcase, UserRound, X,
  LayoutGrid,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface Department {
  id: string;
  name: string;
  description: string | null;
  manage_by: string | null;
  created_at: string;
}

/* ── Manager badge config ── */
const MANAGER_CONFIG: Record<string, { label: string; icon: React.ElementType; classes: string; dot: string }> = {
  admin: {
    label: 'Administrator',
    icon: ShieldCheck,
    classes: 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30',
    dot: 'bg-violet-500',
  },
  manager: {
    label: 'Manager',
    icon: Briefcase,
    classes: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30',
    dot: 'bg-blue-500',
  },
  user: {
    label: 'User',
    icon: UserRound,
    classes: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
};

/* ── Department icon with letter avatar ── */
function DeptAvatar({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  const colors = [
    'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
    'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
    'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300',
    'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${colors[idx]}`}>
      {letter}
    </div>
  );
}

/* ── Manager badge ── */
function ManagerBadge({ manageBy }: { manageBy: string | null }) {
  if (!manageBy) return <span className="text-sm text-slate-300 dark:text-slate-600">—</span>;
  const cfg = MANAGER_CONFIG[manageBy] ?? {
    label: manageBy.charAt(0).toUpperCase() + manageBy.slice(1),
    icon: UserRound,
    classes: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10',
    dot: 'bg-slate-400',
  };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   Main Departments
══════════════════════════════════════════════════════ */
const Departments = () => {
  const { role, loading: authLoading } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [manageBy, setManageBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  /* ── data fetch (unchanged logic) ── */
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('b1g_token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/departments`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast({ title: 'Unauthorized', description: 'Session expired. Please log in again.', variant: 'destructive' });
          localStorage.removeItem('b1g_token'); localStorage.removeItem('b1g_user'); return;
        }
        throw new Error(`Failed to fetch departments: ${res.status}`);
      }
      const data = await res.json();
      setDepartments(data.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  useEffect(() => { if (!authLoading && role === 'admin') fetchDepartments(); }, [role, authLoading]);

  const openCreate = () => {
    setEditDept(null); setName(''); setDescription(''); setManageBy(''); setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditDept(dept); setName(dept.name);
    setDescription(dept.description || ''); setManageBy(dept.manage_by || ''); setDialogOpen(true);
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('Name is required');
    if (!description.trim()) errors.push('Description is required');
    if (!manageBy) errors.push('Managed by is required');
    if (errors.length > 0) { toast({ title: 'Validation Error', description: errors.join(', '), variant: 'destructive' }); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('b1g_token');
      if (!token) { toast({ title: 'Unauthorized', description: 'Session expired.', variant: 'destructive' }); return; }
      const url = editDept ? `${API_BASE}/departments/${editDept.id}` : `${API_BASE}/departments`;
      const method = editDept ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, manage_by: manageBy }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Request failed'); }
      toast({ title: editDept ? 'Department updated' : 'Department created' });
      setDialogOpen(false); fetchDepartments();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDelete = (dept: Department) => { setDeptToDelete(dept); setDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!deptToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/departments/${deptToDelete.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message ?? 'Delete failed'); }
      toast({ title: 'Department deleted' });
      setDeleteDialogOpen(false); setDeptToDelete(null); fetchDepartments();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

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
            <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
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
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-blue-300/10 dark:bg-blue-700/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet-300/10 dark:bg-violet-700/8 blur-3xl" />
        </div>

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="h-4 w-4 text-blue-500" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400">
                Organization
              </p>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Departments
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {departments.length} department{departments.length !== 1 ? 's' : ''} in your organization
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-500
                       dark:hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20
                       hover:shadow-violet-500/30 transition-all duration-200 font-semibold"
          >
            <Plus className="h-4 w-4" /> Add Department
          </Button>
        </div>

        {/* ── Dept stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {departments.slice(0, 4).map((dept, i) => {
            const colors = [
              { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200/70 dark:border-violet-500/20', dot: 'bg-violet-400' },
              { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200/70 dark:border-blue-500/20', dot: 'bg-blue-400' },
              { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200/70 dark:border-amber-500/20', dot: 'bg-amber-400' },
              { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200/70 dark:border-emerald-500/20', dot: 'bg-emerald-400' },
            ];
            const c = colors[i % colors.length];
            return (
              <div key={dept.id} className={`rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm px-4 py-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
                    {dept.name}
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {dept.description || '—'}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Search bar ── */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or description…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-9 h-10 rounded-xl border-slate-200 dark:border-white/10
                       bg-white/80 dark:bg-white/5 backdrop-blur-sm text-sm
                       focus:ring-violet-500/30 focus:border-violet-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full
                         flex items-center justify-center bg-slate-200 dark:bg-slate-700
                         hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              <X className="h-3 w-3 text-slate-500 dark:text-slate-400" />
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-white/10
                        bg-white/80 dark:bg-white/5 backdrop-blur-md shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 dark:border-white/8 hover:bg-transparent">
                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-5">
                  Department
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Description
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Managed by
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map(dept => (
                <TableRow
                  key={dept.id}
                  className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/80
                             dark:hover:bg-white/5 transition-colors duration-150 group"
                >
                  <TableCell className="pl-5 py-4">
                    <div className="flex items-center gap-3">
                      <DeptAvatar name={dept.name} />
                      <span className="font-semibold text-slate-800 dark:text-white text-sm">{dept.name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 max-w-[280px]">
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {dept.description || <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </p>
                  </TableCell>

                  <TableCell className="py-4">
                    <ManagerBadge manageBy={dept.manage_by} />
                  </TableCell>

                  <TableCell className="py-4 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => openEdit(dept)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center
                                   bg-slate-100 dark:bg-white/10 hover:bg-violet-100 dark:hover:bg-violet-500/20
                                   text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300
                                   transition-all duration-150"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredDepartments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-slate-200 dark:text-slate-700" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        {searchTerm ? 'No departments match your search' : 'No departments yet'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Add / Edit Dialog ── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                {editDept ? 'Edit Department' : 'Add Department'}
              </DialogTitle>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {editDept ? 'Update department details' : 'Create a new department in your organization'}
              </p>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. IT, HR, Sales"
                  className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-violet-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Description <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe this department's purpose…"
                  rows={3}
                  className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-violet-500/30 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Managed by <span className="text-rose-500">*</span>
                </Label>
                <Select value={manageBy} onValueChange={setManageBy}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <SelectValue placeholder="Select manager role…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
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
                className="rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-500
                           dark:hover:bg-violet-600 text-white shadow-md shadow-violet-500/20 font-semibold"
              >
                {loading
                  ? <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving…
                    </span>
                  : editDept ? 'Save Changes' : 'Create Department'
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
                  Delete Department
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-2 py-1">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-800 dark:text-white">{deptToDelete?.name}</span>?
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                This action cannot be undone. The department will be permanently removed from the system.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => { setDeleteDialogOpen(false); setDeptToDelete(null); }}
                className="rounded-xl border-slate-200 dark:border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 font-semibold"
              >
                Delete Department
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Departments;