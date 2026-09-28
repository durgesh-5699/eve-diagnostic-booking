import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import type { JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or invalid Authorization header'));
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    req.user = verifyToken(token);
    next();
  } catch(err){
    console.error('JWT verify failed:', (err as Error).message);
    next(new AppError(401, 'Invalid or expired token'));
  }
}