// ─── EMAIL ────────────────────────────────────────────────────────────────────
// Checks if the provided string is a valid email format
export const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ─── PASSWORD ─────────────────────────────────────────────────────────────────
// Password must be at least 8 characters long
export const isValidPassword = (password: string): boolean => {
    return password.length >= 8;
};

// ─── REQUIRED FIELDS ──────────────────────────────────────────────────────────
// Checks that all required fields exist and are not empty strings in the request body.
// Returns the name of the first missing field, or null if all are present.
// Usage: const missing = getMissingField(req.body, ['email', 'password', 'fullName'])
export const getMissingField = (
    body: Record<string, unknown>,
    fields: string[]
): string | null => {
    for (const field of fields) {
        if (!body[field] || String(body[field]).trim() === '') {
            return field;
        }
    }
    return null;
};

// ─── ROLE ─────────────────────────────────────────────────────────────────────
// Role validation - now accepts any string value
export const isValidRole = (role: string): boolean => {
    return role && role.trim().length > 0;
};

// ─── UUID ─────────────────────────────────────────────────────────────────────
// Checks if the provided string is a valid UUID (used for ID params)
export const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
// Task progress must be between 0 and 100
export const isValidProgress = (progress: number): boolean => {
    return progress >= 0 && progress <= 100;
};