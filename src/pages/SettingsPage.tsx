import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import UserAvatar from '@/components/UserAvatar';
import { Settings as SettingsIcon, Palette, Bell } from 'lucide-react';

const SettingsPage = () => {
  const { profile, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-display font-bold">Settings</h1>

        {/* Profile */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <SettingsIcon className="h-5 w-5" /> Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <UserAvatar
              fullName={profile?.full_name || 'User'}
              avatarUrl={profile?.avatar_url}
              size="lg"
            />
            <div>
              <p className="font-semibold text-lg">{profile?.full_name}</p>
              <p className="text-muted-foreground text-sm">{profile?.email}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">Role: {role}</p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Palette className="h-5 w-5" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-sm">Dark Mode</Label>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Bell className="h-5 w-5" /> Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif" className="text-sm">Email Notifications</Label>
              <Switch id="email-notif" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="task-reminder" className="text-sm">Task Reminder Notifications</Label>
              <Switch id="task-reminder" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
