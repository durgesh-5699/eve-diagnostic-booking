import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorMiddleware(
  err: Error & { type?: string },
  req: Request,
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

  // Sirf unexpected errors stack trace ke saath log hote hain
  req.log.error({ err }, 'unhandled error');
  return res.status(500).json({ error: 'Internal server error' });
}