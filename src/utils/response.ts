import { Response } from 'express';
import { ApiResponse } from '../types';

export class ResponseUtil {
  static success<T>(
    res: Response,
    data?: T,
    message = 'Success',
    statusCode = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      statusCode,
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    error: string | Error,
    statusCode = 400,
    data?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : error,
      statusCode,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return ResponseUtil.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return ResponseUtil.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Resource not found'): Response {
    return ResponseUtil.error(res, message, 404);
  }

  static validationError(res: Response, errors: any): Response {
    return ResponseUtil.error(res, 'Validation failed', 422, errors);
  }

  static serverError(
    res: Response,
    error: Error,
    message = 'Internal server error'
  ): Response {
    // Log the actual error for debugging
    console.error('Server Error:', error);
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? message 
      : error.message;
    
    return ResponseUtil.error(res, errorMessage, 500);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success'
  ): Response {
    const totalPages = Math.ceil(total / limit);
    return ResponseUtil.success(res, {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }, message);
  }
} 