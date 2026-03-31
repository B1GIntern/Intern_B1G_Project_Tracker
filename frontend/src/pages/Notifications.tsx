import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { toast } from '@/hooks/use-toast';

import { Bell, Check, X, BellRing, Trash2 } from 'lucide-react';



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

  const { unreadCount, refreshUnreadCount } = useNotification();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [displayCount, setDisplayCount] = useState(5);
  const [showAll, setShowAll] = useState(false);



  const fetchNotifications = async () => {

    try {

      const token = localStorage.getItem('b1g_token');

      if (!token) return;

      

      const res = await fetch(`${API_BASE}/notifications`, {

        credentials: 'include',

        headers: {

          'Authorization': `Bearer ${token}`

        }

      });

      

      if (!res.ok) {

        console.error('Failed to fetch notifications');

        return;

      }

      

      const data = await res.json();

      const notificationsWithType = data.data.map((n: any) => ({

        ...n,

        type: n.type === 'task_assigned' ? 'info' : 

               n.type === 'task_due' ? 'warning' :

               n.type === 'task_overdue' ? 'error' :

               n.type === 'task_approved' ? 'success' :

               n.type === 'task_declined' ? 'error' : 'info'

      }));

      setNotifications(notificationsWithType);

    } catch (error) {

      console.error('Error fetching notifications:', error);

    }

  };



  useEffect(() => { 
    if (isOpen) {
      fetchNotifications();
      refreshUnreadCount();
      // Reset display count when opening
      setDisplayCount(5);
      setShowAll(false);
    }
  }, [isOpen, user]);



  const markRead = async (id: string) => {

    try {

      const token = localStorage.getItem('b1g_token');

      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {

        method: 'PATCH',

        credentials: 'include',

        headers: {

          ...(token && { 'Authorization': `Bearer ${token}` })

        }

      });

      if (!res.ok) return;

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

      // Trigger immediate refresh in navbar

      refreshUnreadCount();

    } catch { }

  };



  const markAllRead = async () => {

    try {

      const token = localStorage.getItem('b1g_token');

      const res = await fetch(`${API_BASE}/notifications/read-all`, {

        method: 'PATCH',

        credentials: 'include',

        headers: {

          ...(token && { 'Authorization': `Bearer ${token}` })

        }

      });

      if (!res.ok) return;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      // Trigger immediate refresh in navbar

      refreshUnreadCount();

      toast({ title: 'All notifications marked as read' });

      // Close dropdown

      setTimeout(() => {

        onClose();

      }, 100);

    } catch { }

  };



  const deleteNotification = async (id: string) => {

    try {

      const token = localStorage.getItem('b1g_token');

      const res = await fetch(`${API_BASE}/notifications/${id}`, {

        method: 'DELETE',

        credentials: 'include',

        headers: {

          ...(token && { 'Authorization': `Bearer ${token}` })

        }

      });

      if (!res.ok) return;

      setNotifications(prev => prev.filter(n => n.id !== id));

      // Trigger immediate refresh in navbar

      refreshUnreadCount();

    } catch { }

  };



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

              {(showAll ? notifications : notifications.slice(0, displayCount)).map(n => (

                <Card 

                  key={n.id} 

                  className={`border-0 rounded-none shadow-none cursor-pointer transition-all hover:shadow-md ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}

                  onClick={() => {

                    // Mark as read first

                    if (!n.read) {

                      markRead(n.id);

                    }

                    // Then redirect to Task Tracker

                    window.location.href = '/tracker';

                    // Optional: Scroll to specific task after delay

                    setTimeout(() => {

                      if (n.task_id) {

                        const TaskElement = document.querySelector(`[data-task-id="${n.task_id}"]`);

                        if (TaskElement) {

                          TaskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                          TaskElement.classList.add('ring-2', 'ring-blue-500');

                          setTimeout(() => {

                            TaskElement.classList.remove('ring-2', 'ring-blue-500');

                          }, 2000);

                        }

                      }

                    }, 500);

                  }}

                >

                  <CardContent className="p-3 flex flex-col gap-2">

                    <div className="flex items-center justify-between">

                      <h4 className={`text-sm font-medium truncate ${!n.read ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'}`}>

                        {n.title}

                      </h4>

                      <div className="flex items-center gap-2">

                        <span className="text-lg">{typeIconMap[n.type] || '📝'}</span>

                        {!n.read && (

                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>

                        )}

                      </div>

                    </div>

                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{n.message}</p>

                    <div className="flex items-center justify-between">

                      <p className="text-xs text-muted-foreground">

                        {new Date(n.created_at).toLocaleDateString()}

                      </p>

                      <div className="flex items-center gap-2">

                        {!n.read && (

                          <Button 

                            variant="ghost" 

                            size="sm" 

                            onClick={(e) => {

                              e.stopPropagation(); // Prevent card click

                              markRead(n.id);

                            }}

                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"

                          >

                            <Check className="h-3 w-3" />

                          </Button>

                        )}

                        <Button 

                          variant="ghost" 

                          size="sm" 

                          onClick={(e) => {

                            e.stopPropagation(); // Prevent card click

                            deleteNotification(n.id);

                          }}

                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"

                          title="Delete notification"

                        >

                          <Trash2 className="h-3 w-3" />

                        </Button>

                      </div>

                    </div>

                  </CardContent>

                </Card>

              ))}

              {/* See More / See Less Button */}
              {notifications.length > 5 && (
                <div className="p-2 text-center border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    {showAll ? 'See Less' : `See More (${notifications.length - displayCount} more)`}
                  </Button>
                </div>
              )}

            </div>

          )}

        </div>

      </div>

    </div>

  );

};



// Export as default for use in components

export default NotificationsDropdown;

