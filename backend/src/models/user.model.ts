// ─── USER ─────────────────────────────────────────────────────────────────────

// Matches the `users` table — stores login credentials

export interface User {

    id: string;

    email: string;

    password: string;

    created_at: Date;

    updated_at: Date;

}



// ─── PROFILE ──────────────────────────────────────────────────────────────────

// Matches the `profiles` table — stores display info for each user

export interface Profile {

    id: string;

    user_id: string;

    full_name: string;

    email: string;

    avatar_url: string | null;

    created_at: Date;

    updated_at: Date;

}



// ─── ROLE ─────────────────────────────────────────────────────────────────────

// The 3 roles in the system

export type AppRole = 'admin' | 'manager' | 'employee';



// Matches the `user_roles` table

export interface UserRole {

    id: string;

    user_id: string;

    role: AppRole;

    created_at: Date;

    updated_at: Date;

}



// ─── USER DEPARTMENT ──────────────────────────────────────────────────────────

// Matches the `user_departments` table — links a user to a department

export interface UserDepartment {

    id: string;

    user_id: string;

    department_id: string;

    created_at: Date;

}



// ─── DISPLAY USER ─────────────────────────────────────────────────────────────

// Combined shape returned in API responses (joins users + profiles + roles + departments)

export interface DisplayUser {

    user_id: string;

    full_name: string;

    email: string;

    avatar_url: string | null;

    role: AppRole;

    department_id: string | null;

    department_name: string | null;

}



// ─── TEAM MEMBER ──────────────────────────────────────────────────────────────

// Same as DisplayUser — used specifically in the Team page response

export interface TeamMember {

    user_id: string;

    full_name: string;

    email: string;

    avatar_url: string | null;

    role: AppRole;

    department_id: string | null;

    department_name: string | null;

}



// ─── JWT PAYLOAD ──────────────────────────────────────────────────────────────

// The data stored inside the JWT token after login

export interface JwtPayload {

    userId: string;

    role: AppRole;

}