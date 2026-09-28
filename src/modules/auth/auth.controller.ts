import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export async function signupHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signup(req.body);
    req.log.info({ userId: result.user.id }, 'user signed up');
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    req.log.info({ userId: result.user.id }, 'user logged in');
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}