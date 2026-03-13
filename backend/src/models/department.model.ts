// ─── DEPARTMENT ───────────────────────────────────────────────────────────────
// Matches the `departments` table
export interface Department {
    id: string;
    name: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
}

// ─── DEPARTMENT STATS ─────────────────────────────────────────────────────────
// Per-department breakdown used in the admin dashboard chart
export interface DepartmentStats {
    department_id: string;
    department_name: string;
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    overdue_tasks: number;
}

// ─── REQUEST BODIES ───────────────────────────────────────────────────────────
// Shape of the request body when creating a department
export interface CreateDepartmentBody {
    name: string;
    description?: string;
}

// Shape of the request body when updating a department (all fields optional)
export interface UpdateDepartmentBody extends Partial<CreateDepartmentBody> { }