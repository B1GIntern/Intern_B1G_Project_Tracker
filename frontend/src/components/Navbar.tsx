import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import GlobalSearch from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import {
  Bell, LogOut, Settings, User, Sun, Moon,
  LayoutDashboard, Users, Building2, ListTodo, Menu, X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import NotificationsDropdown from '@/pages/Notifications';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const Navbar = () => {
  const { profile, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_BASE}/notifications/unread-count`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      } catch {
        setUnreadCount(0);
      }
    };
    fetchUnread();
  }, [location]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Tracker', href: '/tracker', icon: ListTodo },
    ...(role === 'admin' ? [
      { label: 'Users', href: '/users', icon: Users },
      { label: 'Departments', href: '/departments', icon: Building2 },
    ] : role === 'manager' ? [
      { label: 'My Team', href: '/team', icon: Users },
    ] : []),
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">B1G</span>
            </div>
            <span className="hidden sm:inline text-lg font-display font-bold text-foreground">
              Project Tracker
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 mx-4">
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Search + Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block w-48 lg:w-72">
              <GlobalSearch />
            </div>

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* Bell Button — triggers NotificationsDropdown */}
            <button
              className="relative flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors">
                  <UserAvatar
                    fullName={profile?.full_name ?? 'User'}
                    avatarUrl={profile?.avatar_url}
                    size="sm"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  <Badge variant="secondary" className="mt-1 capitalize text-xs">{role}</Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings?tab=profile')}>
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings?tab=settings')}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border/50 pt-2 animate-fade-in">
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Notifications Dropdown — uses isOpen/onClose from Notifications.tsx */}
      <NotificationsDropdown
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </nav>
  );
};

export default Navbar;