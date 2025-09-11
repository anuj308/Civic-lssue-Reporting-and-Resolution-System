import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

/**
 * 404 Not Found middleware
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Route not found - ${req.originalUrl}`) as ApiError;
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};
