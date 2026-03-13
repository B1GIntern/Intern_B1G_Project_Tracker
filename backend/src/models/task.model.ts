// ─── TASK STATUS ──────────────────────────────────────────────────────────────
// The 6 possible statuses for a task — maps to Kanban columns
export type TaskStatus =
    | 'todo'
    | 'in_progress'
    | 'under_review'
    | 'approved'
    | 'declined'
    | 'completed';

// ─── TASK ─────────────────────────────────────────────────────────────────────
// Matches the `tasks` table
export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    progress: number;
    due_date: Date | null;
    assigned_to: string | null;
    created_by: string;
    department_id: string | null;
    created_at: Date;
    updated_at: Date;
}

// ─── TASK ATTACHMENT ──────────────────────────────────────────────────────────
// Matches the `task_attachments` table — files linked to a task
export interface TaskAttachment {
    id: string;
    task_id: string;
    file_name: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    uploaded_by: string;
    created_at: Date;
}

// ─── REQUEST BODIES ───────────────────────────────────────────────────────────
// Shape of the request body when creating a task
export interface CreateTaskBody {
    title: string;
    description?: string;
    status?: TaskStatus;
    progress?: number;
    due_date?: string;
    assigned_to?: string;
    department_id?: string;
}

// Shape of the request body when updating a task (all fields optional)
export interface UpdateTaskBody extends Partial<CreateTaskBody> { }