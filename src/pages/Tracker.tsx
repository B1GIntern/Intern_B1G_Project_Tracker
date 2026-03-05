import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo } from 'lucide-react';

const Tracker = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Task Tracker</h1>
            <p className="text-muted-foreground">Manage and track all tasks</p>
          </div>
        </div>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <ListTodo className="h-5 w-5" /> Kanban Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Task tracker will be built in Phase 3.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Tracker;
