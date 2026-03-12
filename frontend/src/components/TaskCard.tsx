import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    progress: number;
    due_date: string | null;
    assigned_to: string | null;
    assignee_name?: string;
  };
  onClick: () => void;
}

const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border/50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow space-y-2"
    >
      <p className="font-medium text-sm leading-tight">{task.title}</p>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}
      <Progress value={task.progress} className="h-1.5" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{task.progress}%</span>
        {task.due_date && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), 'MMM d')}
          </div>
        )}
      </div>
      {task.assignee_name && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {task.assignee_name}
        </div>
      )}
    </div>
  );
};

export default TaskCard;