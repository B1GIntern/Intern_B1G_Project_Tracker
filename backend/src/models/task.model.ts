// ─── TASK STATUS ──────────────────────────────────────────────────────────────
// Task status is now dynamic - retrieved from database
export type TaskStatus = string;

// ─── TASK ─────────────────────────────────────────────────────────────────────
// Matches the `tracker_tasks` table
export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    assigned_to: string | null;
    created_by: string;
    department_id: string | null;
    due_date: Date | null;
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
    assigned_to?: string;
    department_id?: string;
    due_date?: Date | string | null;
}

// Shape of the request body when updating a task (all fields optional)
export interface UpdateTaskBody extends Partial<CreateTaskBody> { }