import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import * as paymentsService from './payments.service';

export async function createPaymentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await paymentsService.processPayment(req.user!.userId, req.body.bookingId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function webhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentsService.handleWebhook(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}