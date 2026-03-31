import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import AppLayout from '@/components/AppLayout';
import UserAvatar from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  User, Palette, Bell, Upload, Save, Lock, LogOut,
  ShieldCheck, Eye, EyeOff, Moon, Sun, Mail,
  BellRing, BellOff, Clock, ChevronRight,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/* ── Role badge ── */
const ROLE_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  admin:    { label: 'Admin',    classes: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30', dot: 'bg-violet-500' },
  manager:  { label: 'Manager',  classes: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30', dot: 'bg-blue-500' },
  employee: { label: 'Employee', classes: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  user:     { label: 'User',     classes: 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-500/30', dot: 'bg-slate-400' },
};

/* ── Section card wrapper ── */
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/70 dark:border-white/10
                     bg-white/80 dark:bg-white/5 backdrop-blur-md shadow-sm
                     overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ icon: Icon, title, accent = 'text-slate-500 dark:text-slate-400' }: {
  icon: React.ElementType; title: string; accent?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-white/8">
      <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
    </div>
  );
}

/* ── Toggle row ── */
function ToggleRow({ icon: Icon, label, description, checked, onChange, iconColor = 'text-slate-400 dark:text-slate-500' }: {
  icon: React.ElementType; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main SettingsPage
══════════════════════════════════════════════════════ */
const SettingsPage = () => {
  const { user, profile, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailNotif, setEmailNotif] = useState(() => {
    const saved = localStorage.getItem('b1g_emailNotif');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [taskReminder, setTaskReminder] = useState(() => {
    const saved = localStorage.getItem('b1g_taskReminder');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [dueDateAlert, setDueDateAlert] = useState(() => {
    const saved = localStorage.getItem('b1g_dueDateAlert');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => { localStorage.setItem('b1g_emailNotif', JSON.stringify(emailNotif)); }, [emailNotif]);
  useEffect(() => { localStorage.setItem('b1g_taskReminder', JSON.stringify(taskReminder)); }, [taskReminder]);
  useEffect(() => { localStorage.setItem('b1g_dueDateAlert', JSON.stringify(dueDateAlert)); }, [dueDateAlert]);

  /* ── unchanged handlers ── */
  const handleSaveProfile = async () => {
    if (!user) { toast({ title: 'Error', description: 'No user logged in', variant: 'destructive' }); return; }
    if (!fullName || fullName.trim() === '') { toast({ title: 'Error', description: 'Full name cannot be empty', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('b1g_token');
      if (!token) { toast({ title: 'Error', description: 'No authentication token found. Please login again.', variant: 'destructive' }); return; }
      const updateData: any = { full_name: fullName.trim() };
      if (email) updateData.email = email.trim();
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) { const errorText = await res.text(); toast({ title: `Error ${res.status}`, description: errorText || 'Failed to update profile', variant: 'destructive' }); return; }
      toast({ title: '✅ Profile updated!', description: 'Refreshing page...' });
      setTimeout(() => window.location.reload(), 1000);
    } catch { toast({ title: 'Error', description: 'Network error or backend not running', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    setUploading(true);
    toast({ title: '✅ Avatar uploaded successfully (Demo Mode)' });
    setUploading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' }); return; }
    if (newPassword.length < 6) { toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    setChangingPassword(true);
    try {
      const token = localStorage.getItem('b1g_token');
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) { const errorData = await res.json(); toast({ title: 'Error', description: errorData.message || 'Failed to change password', variant: 'destructive' }); return; }
      toast({ title: '✅ Password changed successfully' });
      setNewPassword(''); setConfirmPassword('');
    } catch { toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' }); }
    finally { setChangingPassword(false); }
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const roleCfg = ROLE_CONFIG[role ?? 'user'] ?? ROLE_CONFIG.user;

  return (
    <AppLayout>
      <div className="relative animate-fade-in max-w-2xl space-y-5 pb-12">

        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-16 right-0 h-56 w-56 rounded-full bg-violet-300/10 dark:bg-violet-700/8 blur-3xl" />
          <div className="absolute bottom-0 -left-8 h-40 w-40 rounded-full bg-blue-300/10 dark:bg-blue-700/8 blur-3xl" />
        </div>

        {/* ══ PROFILE VIEW ══ */}
        {activeTab === 'profile' && (
          <>
            {/* Page header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-violet-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500 dark:text-violet-400">
                  Account
                </p>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Profile</h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage your personal information and security</p>
            </div>

            {/* Personal Information */}
            <SectionCard>
              <SectionHeader icon={User} title="Personal Information" accent="text-violet-500" />

              <div className="p-5 space-y-5">
                {/* Avatar + info */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8">
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to change photo"
                  >
                    <UserAvatar
                      fullName={profile?.full_name || 'User'}
                      avatarUrl={profile?.avatar_url}
                      size="lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-black text-base text-slate-900 dark:text-white truncate">{profile?.full_name}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 truncate">{profile?.email}</p>
                    <span className={`inline-flex items-center gap-1.5 mt-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleCfg.classes}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${roleCfg.dot}`} />
                      <ShieldCheck className="h-3 w-3" />
                      {roleCfg.label}
                    </span>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Full Name
                  </Label>
                  <Input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5
                               text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600
                               focus:ring-violet-500/30 focus:border-violet-400"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Email Address
                  </Label>
                  <Input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5
                               text-slate-900 dark:text-white focus:ring-violet-500/30 focus:border-violet-400"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500">You can update your email address.</p>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-500
                             dark:hover:bg-violet-600 text-white shadow-md shadow-violet-500/20 font-semibold"
                >
                  {saving
                    ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
                    : <><Save className="h-4 w-4" />Save Changes</>
                  }
                </Button>
              </div>
            </SectionCard>

            {/* Change Password */}
            <SectionCard>
              <SectionHeader icon={Lock} title="Change Password" accent="text-amber-500" />

              <div className="p-5 space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="pr-10 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5
                                 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600
                                 focus:ring-violet-500/30 focus:border-violet-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500
                                 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pr-10 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5
                                 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600
                                 focus:ring-violet-500/30 focus:border-violet-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500
                                 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => {
                        const strength = [
                          newPassword.length >= 6,
                          /[A-Z]/.test(newPassword),
                          /[0-9]/.test(newPassword),
                          /[^A-Za-z0-9]/.test(newPassword),
                        ].filter(Boolean).length;
                        return (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength
                                ? strength <= 1 ? 'bg-rose-400' : strength <= 2 ? 'bg-amber-400' : strength <= 3 ? 'bg-blue-400' : 'bg-emerald-400'
                                : 'bg-slate-100 dark:bg-white/10'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {(() => {
                        const s = [newPassword.length >= 6, /[A-Z]/.test(newPassword), /[0-9]/.test(newPassword), /[^A-Za-z0-9]/.test(newPassword)].filter(Boolean).length;
                        return ['Weak', 'Fair', 'Good', 'Strong'][s - 1] ?? 'Too short';
                      })()} password
                    </p>
                  </div>
                )}

                {/* Match indicator */}
                {confirmPassword && (
                  <p className={`text-xs font-medium ${newPassword === confirmPassword ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  variant="outline"
                  className="gap-2 rounded-xl border-slate-200 dark:border-white/15 bg-white dark:bg-white/5
                             text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10
                             disabled:opacity-40 font-semibold"
                >
                  {changingPassword
                    ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />Updating…</>
                    : <><Lock className="h-4 w-4" />Update Password</>
                  }
                </Button>
              </div>
            </SectionCard>
          </>
        )}

        {/* ══ SETTINGS VIEW ══ */}
        {activeTab === 'settings' && (
          <>
            {/* Page header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Palette className="h-4 w-4 text-blue-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400">
                  Preferences
                </p>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Settings</h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Customize your experience and notifications</p>
            </div>

            {/* Appearance */}
            <SectionCard>
              <SectionHeader icon={Palette} title="Appearance" accent="text-blue-500" />

              <div className="p-5">
                {/* Theme toggle visual */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl
                                bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300
                      ${theme === 'dark'
                        ? 'bg-slate-800 border border-slate-700'
                        : 'bg-amber-50 border border-amber-200'}`}>
                      {theme === 'dark'
                        ? <Moon className="h-4 w-4 text-slate-300" />
                        : <Sun className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                      </p>
                    </div>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>

                {/* Theme preview pills */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold
                      transition-all duration-200 border
                      ${theme !== 'dark'
                        ? 'bg-white border-violet-300 text-violet-700 shadow-sm shadow-violet-100'
                        : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-white/20'}`}
                  >
                    <Sun className="h-3.5 w-3.5" /> Light
                  </button>
                  <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold
                      transition-all duration-200 border
                      ${theme === 'dark'
                        ? 'bg-slate-800 border-violet-500/50 text-violet-300 shadow-sm'
                        : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400 hover:border-slate-300'}`}
                  >
                    <Moon className="h-3.5 w-3.5" /> Dark
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Notification Preferences */}
            <SectionCard>
              <SectionHeader icon={Bell} title="Notification Preferences" accent="text-amber-500" />
              <div className="divide-y divide-slate-50 dark:divide-white/5">
                <ToggleRow
                  icon={Mail}
                  label="Email Notifications"
                  description="Receive project updates via email"
                  checked={emailNotif}
                  onChange={setEmailNotif}
                  iconColor={emailNotif ? 'text-violet-500' : 'text-slate-300 dark:text-slate-600'}
                />
                <ToggleRow
                  icon={BellRing}
                  label="Task Reminders"
                  description="Get reminded about your assigned tasks"
                  checked={taskReminder}
                  onChange={setTaskReminder}
                  iconColor={taskReminder ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}
                />
                <ToggleRow
                  icon={Clock}
                  label="Due Date Alerts"
                  description="Be notified before tasks are due"
                  checked={dueDateAlert}
                  onChange={setDueDateAlert}
                  iconColor={dueDateAlert ? 'text-rose-500' : 'text-slate-300 dark:text-slate-600'}
                />
              </div>
            </SectionCard>

            {/* Session / Sign Out */}
            <SectionCard className="border-rose-200/70 dark:border-rose-500/20">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-rose-100 dark:border-rose-500/15">
                <div className="h-7 w-7 rounded-lg bg-rose-50 dark:bg-rose-500/15 flex items-center justify-center">
                  <LogOut className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Session</p>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl
                                bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/15">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
                      <LogOut className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Sign Out</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Log out of your B1G account</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    size="sm"
                    className="gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white
                               shadow-md shadow-rose-500/20 font-semibold border-0"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </Button>
                </div>
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default SettingsPage;