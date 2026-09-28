import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorMiddleware(
  err: Error & { type?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // express.json() ka parse failure client ki galti hai, server ki nahi
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  console.error('Unexpected error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}