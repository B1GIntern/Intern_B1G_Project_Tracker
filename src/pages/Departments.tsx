import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

const Departments = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display font-bold">Departments</h1>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Building2 className="h-5 w-5" /> All Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Department management will be built in Phase 2.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Departments;
