import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Paperclip, Download, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  department_id: string | null;
  created_at: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  role?: string;
  department_id?: string;
}

interface Department {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'underreview', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
];

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  profiles: Profile[];
  departments: Department[];
  isNew?: boolean;
}

const TaskDetailPanel = ({ task, open, onClose, onSaved, profiles, departments, isNew }: TaskDetailPanelProps) => {
  const { user, profile, role } = useAuth();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState(task?.status ?? 'todo');
  const [dueDateTime, setDueDateTime] = useState(''); // Combined date and time
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to ?? '');
  const [departmentId, setDepartmentId] = useState(task?.department_id ?? '');
  const [departmentName, setDepartmentName] = useState(() => {
    return departments.find(d => d.id === task?.department_id)?.name || '';
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check if user is employee (read-only access)
  const isEmployee = role === 'employee';

  // Determine due date color based on task status
  const getDueDateColor = () => {
    if (!task?.due_date) return '';
    
    switch (task.status) {
      case 'todo':
      case 'in_progress':
      case 'underreview':
        return 'text-red-500'; // Red for To Do, In Progress, Under Review
      case 'completed':
        return 'text-green-500'; // Green for Done
      default:
        return ''; // Default for other statuses
    }
  };

  // Format due date for display
  const formatDueDateDisplay = (dueDate: string) => {
    const date = new Date(dueDate);
    return format(date, 'PPP p'); // Full date with time
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      if (task.due_date) {
        const dueDateObj = new Date(task.due_date);
        // Format for datetime-local input: YYYY-MM-DDTHH:mm
        const year = dueDateObj.getFullYear();
        const month = String(dueDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dueDateObj.getDate()).padStart(2, '0');
        const hours = String(dueDateObj.getHours()).padStart(2, '0');
        const minutes = String(dueDateObj.getMinutes()).padStart(2, '0');
        setDueDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        setDueDateTime('');
      }
      setAssignedTo(task.assigned_to || '');
      setDepartmentId(task.department_id || '');
      fetchAttachments(task.id);
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setDueDateTime('');
      setAssignedTo('');
      setDepartmentId('');
      setDepartmentName('');
      setAttachments([]);
    }
  }, [task, departments]);

  // Auto-populate department when assignee is selected (Admin and Manager)
  useEffect(() => {
    if ((role === 'admin' || role === 'manager') && assignedTo && profiles.length > 0) {
      const selectedProfile = profiles.find(p => p.user_id === assignedTo);
      if (selectedProfile && selectedProfile.department_id) {
        setDepartmentId(selectedProfile.department_id);
        setDepartmentName(departments.find(d => d.id === selectedProfile.department_id)?.name || '');
      }
    }
  }, [assignedTo, role, profiles, departments]);

  useEffect(() => {
    setDepartmentName(departments.find(d => d.id === departmentId)?.name || '');
  }, [departmentId, departments]);

  const fetchAttachments = async (taskId: string) => {
    try {
      const token = localStorage.getItem('b1g_token');
      const res = await fetch(`${API_BASE}/tasks/${taskId}/attachments`, {
        credentials: 'include',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      setAttachments(data);
    } catch {
      setAttachments([]);
    }
  };

  const handleSave = async () => {
    // Validation for required fields
    const errors = [];
    
    if (!title.trim()) {
      errors.push('Title is required');
    }
    
    if (!description.trim()) {
      errors.push('Description is required');
    }
    
    if (!dueDateTime) {
      errors.push('Due Date & Time is required');
    }
    
    if (!assignedTo) {
      errors.push('Assigned To is required');
    }
    
    if (errors.length > 0) {
      toast({ 
        title: 'Validation Error', 
        description: errors.join(', '), 
        variant: 'destructive' 
      });
      return;
    }
    
    setSaving(true);
    try {
      // Convert datetime-local to ISO string
      let dueDateTimeISO = null;
      if (dueDateTime) {
        dueDateTimeISO = new Date(dueDateTime).toISOString();
      }
      
      const payload = {
        title,
        description,
        status,
        assigned_to: assignedTo || null,
        department_id: departmentId || null,
        due_date: dueDateTimeISO,
      };

      const url = isNew || !task ? `${API_BASE}/tasks` : `${API_BASE}/tasks/${task.id}`;
      const method = isNew || !task ? 'POST' : 'PUT';

      // Get the auth token from localStorage
      const token = localStorage.getItem('b1g_token');

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Request failed');
      }

      toast({ title: isNew ? 'Task created' : 'Task updated' });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !task) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('b1g_token');
      const res = await fetch(`${API_BASE}/tasks/${task.id}/attachments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      await fetchAttachments(task.id);
      toast({ title: 'File uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleDeleteAttachment = async (att: Attachment) => {
    try {
      const token = localStorage.getItem('b1g_token');
      const res = await fetch(`${API_BASE}/tasks/${task!.id}/attachments/${att.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      await fetchAttachments(task!.id);
      toast({ title: 'Attachment deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'New Task' : 'Task Details'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              disabled={isEmployee} 
              className={isEmployee ? 'bg-muted/50' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label>Description <span className="text-red-500">*</span></Label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3} 
              disabled={isEmployee}
              className={isEmployee ? 'bg-muted/50' : ''}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={isEmployee}>
                <SelectTrigger className={isEmployee ? 'bg-muted/50' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date & Time <span className="text-red-500">*</span></Label>
              <Input 
                type="datetime-local" 
                value={dueDateTime} 
                onChange={e => setDueDateTime(e.target.value)} 
                disabled={isEmployee}
                className={isEmployee ? 'bg-muted/50' : ''}
              />
              {!isNew && task?.due_date && (
                <div className={`text-sm font-medium ${getDueDateColor()}`}>
                  {formatDueDateDisplay(task.due_date)}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assigned To <span className="text-red-500">*</span></Label>
              <Select value={assignedTo} onValueChange={setAssignedTo} disabled={isEmployee}>
                <SelectTrigger className={isEmployee ? 'bg-muted/50' : ''}>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input 
                value={departmentName}
                placeholder="Department will be auto-populated"
                disabled={true}
                className="bg-muted/50"
                readOnly
              />
            </div>
          </div>

          {/* Attachments */}
          {!isNew && task && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" /> Attachments
              </Label>
              <div className="space-y-1">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2 text-sm">
                    <span className="truncate">{att.file_name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={att.file_url} target="_blank" rel="noreferrer">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      {!isEmployee && att.uploaded_by === profile?.id && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAttachment(att)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {!isEmployee && (
                <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload file'}
                  <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isEmployee ? 'Back' : 'Cancel'}
          </Button>
          {!isEmployee && (
            <Button onClick={handleSave} disabled={saving}>
              {isNew ? 'Create Task' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailPanel;