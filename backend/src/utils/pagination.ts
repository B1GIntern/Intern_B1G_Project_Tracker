import { Request } from 'express';

// Shape of pagination params extracted from the request query
export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

// Shape of a paginated API response
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Extracts page and limit from the request query string.
// Defaults: page=1, limit=10
// Example URL: /api/tasks?page=2&limit=20
export const getPagination = (req: Request): PaginationParams => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

// Wraps a list of results with pagination metadata for the API response.
// Usage: sendSuccess(res, paginate(tasks, total, page, limit))
export const paginate = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResult<T> => ({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});