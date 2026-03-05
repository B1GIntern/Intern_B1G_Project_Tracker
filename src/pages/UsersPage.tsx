import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const UsersPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display font-bold">User Management</h1>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Users className="h-5 w-5" /> All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">User management will be built in Phase 2.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UsersPage;
