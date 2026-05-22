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

  // Determine due date color based on task status
  const getDueDateColor = () => {
    if (!task.due_date) return '';
    
    switch (task.status) {
      case 'todo':
      case 'in_progress':
      case 'underreview':
        return 'text-red-500'; // Red for To Do, In Progress, Under Review
      case 'completed':
        return 'text-green-500'; // Green for Done
      default:
        return isOverdue ? 'text-destructive' : ''; // Default behavior for other statuses
    }
  };

  // Format due date with time if available
  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
    
    if (hasTime) {
      // Show full date with time
      return format(date, 'MMM d, h:mm a');
    } else {
      // Show just the date
      return format(date, 'MMM d');
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border/50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow space-y-2 relative"
    >
      {isOverdue && (
        <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs px-2 py-1">
          Overdue
        </Badge>
      )}
      <p className="font-medium text-sm leading-tight">{task.title}</p>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}
      <Progress value={task.progress} className="h-1.5" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{task.progress}%</span>
        {task.due_date && (
          <div className={`flex items-center gap-1 ${getDueDateColor()}`}>
            <Calendar className="h-3 w-3" />
            {formatDueDate(task.due_date)}
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