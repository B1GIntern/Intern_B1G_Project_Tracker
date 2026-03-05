import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

const Notifications = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display font-bold">Notifications</h1>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Bell className="h-5 w-5" /> All Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No notifications yet.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Notifications;
