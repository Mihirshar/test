import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { ValidationError } from 'sequelize';
import multer from 'multer';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
};

// Global error handler
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.userId,
  });

  // Handle known errors
  if (err instanceof AppError) {
    ResponseUtil.error(res, err.message, err.statusCode);
    return;
  }

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    const errors = err.errors.reduce((acc: any, error: any) => {
      acc[error.path] = error.message;
      return acc;
    }, {});
    ResponseUtil.validationError(res, errors);
    return;
  }

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      ResponseUtil.error(res, 'File size too large', 413);
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      ResponseUtil.error(res, 'Too many files', 400);
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      ResponseUtil.error(res, 'Unexpected file field', 400);
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    ResponseUtil.unauthorized(res, 'Invalid token');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    ResponseUtil.unauthorized(res, 'Token expired');
    return;
  }

  // Handle MongoDB/Database errors
  if (err.name === 'CastError') {
    ResponseUtil.error(res, 'Invalid ID format', 400);
    return;
  }

  // Default error
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? err.message : 'Internal server error';
  ResponseUtil.serverError(res, err, message);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 