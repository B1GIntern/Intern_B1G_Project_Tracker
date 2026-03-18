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

// Defaults: page=1, limit=10 (configurable via environment)

// Example URL: /api/tasks?page=2&limit=20

export const getPagination = (req: Request): PaginationParams => {

    const defaultPage = parseInt(process.env.DEFAULT_PAGE ?? '1');

    const defaultLimit = parseInt(process.env.DEFAULT_LIMIT ?? '10');

    const maxLimit = parseInt(process.env.MAX_LIMIT ?? '100');

    

    const page = Math.max(1, parseInt(req.query.page as string) || defaultPage);

    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));

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