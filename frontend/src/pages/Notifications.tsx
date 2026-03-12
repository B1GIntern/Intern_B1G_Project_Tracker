import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  task_id: string | null;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, { credentials: 'include' });
      if (!res.ok) return;
      setNotifications(await res.json());
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markRead = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) return;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) return;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: 'All notifications marked as read' });
    } catch { }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) return;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeColorMap: Record<string, string> = {
    task_assigned: 'bg-info/10 text-info',
    task_due: 'bg-warning/10 text-warning',
    task_overdue: 'bg-destructive/10 text-destructive',
    task_approved: 'bg-success/10 text-success',
    task_declined: 'bg-destructive/10 text-destructive',
    info: 'bg-muted text-muted-foreground',
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" /> Mark All Read
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={`border-border/50 transition-colors ${!n.read ? 'bg-accent/20' : ''}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-1.5 ${typeColorMap[n.type] ?? typeColorMap.info}`}>
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.read && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(n.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNotification(n.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {notifications.length === 0 && (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;