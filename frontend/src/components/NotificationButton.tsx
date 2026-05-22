import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import NotificationsDropdown from '@/pages/Notifications';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const NotificationButton = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('b1g_token');
      if (!token) return;
      
      const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Set up polling to check for new notifications
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      <NotificationsDropdown 
        isOpen={isOpen} 
        onClose={() => {
          setIsOpen(false);
          fetchUnreadCount(); // Refresh count after closing
        }} 
      />
    </div>
  );
};

export default NotificationButton;
