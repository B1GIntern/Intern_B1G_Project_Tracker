import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Bell, Check, X, BellRing } from 'lucide-react';
import { getMockNotifications } from '@/lib/mockData';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  task_id?: string;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsDropdown = ({ isOpen, onClose }: NotificationsDropdownProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    // Use hardcoded mock data
    const mockNotifications = getMockNotifications().map(n => ({
      ...n,
      type: n.type as 'info' | 'success' | 'warning' | 'error'
    }));
    setNotifications(mockNotifications);
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeColorMap: Record<string, { light: string; dark: string }> = {
    info: { 
      light: 'bg-blue-100 text-blue-700 border border-blue-200',
      dark: 'bg-blue-900/30 text-blue-300 border border-blue-800'
    },
    success: { 
      light: 'bg-green-100 text-green-700 border border-green-200',
      dark: 'bg-green-900/30 text-green-300 border border-green-800'
    },
    warning: { 
      light: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      dark: 'bg-yellow-900/30 text-yellow-300 border border-yellow-800'
    },
    error: { 
      light: 'bg-red-100 text-red-700 border border-red-200',
      dark: 'bg-red-900/30 text-red-300 border border-red-800'
    },
  };

  const typeIconMap: Record<string, string> = {
    info: '📝',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-16 right-4 w-96 max-h-96 bg-background rounded-lg shadow-lg border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map(n => (
                <Card key={n.id} className={`border-0 rounded-none shadow-none ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-lg">{typeIconMap[n.type] || '📝'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-medium truncate ${!n.read ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'}`}>
                            {n.title}
                          </h4>
                          {!n.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleDateString()}
                          </p>
                          {!n.read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => markRead(n.id)}
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export as default for use in components
export default NotificationsDropdown;
