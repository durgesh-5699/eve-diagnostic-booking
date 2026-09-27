import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { isValidUuid } from '../utils/validateUuid';

export function validateUuidParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    if (!isValidUuid(value)) {
      return next(new AppError(400, `Invalid ${paramName}: must be a valid UUID`));
    }
    next();
  };
}