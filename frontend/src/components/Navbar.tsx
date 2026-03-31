import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';

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
  const { unreadCount, setUnreadCount } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prevUnreadCount = useRef(0);

  /* ── scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── unread count polling with smart intervals ── */
  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout;
    
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('b1g_token');
        if (!token) return;
        
        const res = await fetch(`${API_BASE}/notifications/unread-count`, {
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!res.ok) return;
        const data = await res.json();
        
        if (isMounted) {
          const count = data.data?.count ?? data.count ?? 0;
          setUnreadCount(count);
          
          // Smart polling: faster when unread, slower when all read
          clearInterval(interval);
          interval = setInterval(fetchUnread, count > 0 ? 3000 : 30000);
        }
      } catch {}
    };
    
    // Initial fetch
    fetchUnread();
    
    // Start with slow polling (30s when no notifications)
    interval = setInterval(fetchUnread, 30000);
    
    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchUnread();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty deps to run once on mount

  /* ── auto-show notification dropdown when new notification arrives ── */
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && prevUnreadCount.current !== 0) {
      setNotificationsOpen(true);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

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
  ];

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300
          border-b border-slate-200/60 dark:border-white/10
          bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl
          ${scrolled ? 'shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]' : ''}`}
      >
        {/* Subtle top accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[60px]">

            {/* ── Logo ── */}
            <Link to="/" className="group flex items-center gap-2.5 shrink-0">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl
                              bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/25
                              group-hover:shadow-violet-500/40 transition-shadow duration-300">
                {/* Inner glow dot */}
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white/40" />
                <span className="text-[11px] font-black text-white tracking-tight">B1G</span>
              </div>
              <span className="hidden sm:inline text-[15px] font-black tracking-tight text-slate-800 dark:text-white">
                Project<span className="text-violet-500"> Tracker</span>
              </span>
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-0.5 mx-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold
                      transition-all duration-200 group
                      ${isActive
                        ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
                      }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110
                      ${isActive ? 'text-violet-500 dark:text-violet-400' : ''}`} />
                    {item.label}
                    {/* Active underline pip */}
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full
                                       bg-violet-500 dark:bg-violet-400" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-1.5">

              {/* Search */}
              <div className="hidden sm:block w-44 lg:w-64">
                <GlobalSearch />
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center h-8 w-8 rounded-xl
                           text-slate-500 dark:text-slate-400
                           hover:text-slate-800 dark:hover:text-white
                           hover:bg-slate-100 dark:hover:bg-white/8
                           transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'light'
                  ? <Moon className="h-4 w-4" />
                  : <Sun className="h-4 w-4" />}
              </button>

              {/* Bell - keep count visible even when dropdown is open */}
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex items-center justify-center h-8 w-8 rounded-xl
                           text-slate-500 dark:text-slate-400
                           hover:text-slate-800 dark:hover:text-white
                           hover:bg-slate-100 dark:hover:bg-white/8
                           transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center
                               h-4 w-4 rounded-full bg-rose-500 text-white font-bold
                               ring-2 ring-white dark:ring-slate-950
                               text-[9px] shadow-md shadow-rose-500/30 animate-pulse z-50"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Divider */}
              <span className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-white/10 mx-0.5" />

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-xl pl-1 pr-2.5 py-1
                               hover:bg-slate-100 dark:hover:bg-white/8
                               border border-transparent hover:border-slate-200/80 dark:hover:border-white/10
                               transition-all duration-200 group"
                  >
                    <UserAvatar
                      fullName={profile?.full_name ?? 'User'}
                      avatarUrl={profile?.avatar_url}
                      size="sm"
                    />
                    <span className="hidden lg:block text-[12px] font-semibold text-slate-700 dark:text-slate-300
                                     group-hover:text-slate-900 dark:group-hover:text-white transition-colors max-w-[80px] truncate">
                      {profile?.full_name?.split(' ')[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-2xl border border-slate-200/70 dark:border-white/10
                             bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl
                             dark:shadow-black/40 p-1"
                >
                  {/* User info header */}
                  <div className="px-3 py-3 rounded-xl bg-slate-50 dark:bg-white/5 mb-1">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate">
                      {profile?.full_name}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{profile?.email}</p>
                    <Badge
                      variant="secondary"
                      className="mt-1.5 capitalize text-[10px] px-2 py-0.5
                                 bg-violet-100 dark:bg-violet-500/15
                                 text-violet-700 dark:text-violet-300 border-0"
                    >
                      {role}
                    </Badge>
                  </div>

                  <DropdownMenuItem
                    onClick={() => navigate('/settings?tab=profile')}
                    className="rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-300
                               hover:text-slate-900 dark:hover:text-white
                               hover:bg-slate-100 dark:hover:bg-white/8 cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 mr-2 text-slate-400" /> Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate('/settings?tab=settings')}
                    className="rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-300
                               hover:text-slate-900 dark:hover:text-white
                               hover:bg-slate-100 dark:hover:bg-white/8 cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5 mr-2 text-slate-400" /> Settings
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-white/10" />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="rounded-xl text-[13px] font-medium text-rose-500 dark:text-rose-400
                               hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center h-8 w-8 rounded-xl
                           text-slate-500 dark:text-slate-400
                           hover:text-slate-800 dark:hover:text-white
                           hover:bg-slate-100 dark:hover:bg-white/8
                           transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* ── Mobile nav ── */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-3 pt-2 border-t border-slate-200/60 dark:border-white/10 animate-fade-in">
              {/* Mobile search */}
              <div className="sm:hidden mb-2 px-1">
                <GlobalSearch />
              </div>

              <div className="space-y-0.5">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all
                        ${isActive
                          ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
                        }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Notifications dropdown (unchanged) */}
      <NotificationsDropdown
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
};

export default Navbar;