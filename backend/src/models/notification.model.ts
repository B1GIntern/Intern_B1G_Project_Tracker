// ─── NOTIFICATION TYPE ────────────────────────────────────────────────────────
// The types of notifications the system can create
export type NotifType =
    | 'task_assigned'
    | 'task_due'
    | 'task_overdue'
    | 'task_approved'
    | 'task_declined'
    | 'info';

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────
// Matches the `notifications` table
export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotifType;
    read: boolean;
    task_id: string | null;
    created_at: Date;
}

// ─── SEARCH RESULT ────────────────────────────────────────────────────────────
// Shape returned by the global search endpoint /api/notifications/search?q=
export interface SearchResult {
    type: 'task' | 'user' | 'department';
    id: string;
    label: string;
    sublabel?: string;
}