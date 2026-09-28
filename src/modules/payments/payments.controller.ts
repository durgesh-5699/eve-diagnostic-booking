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
    req.log.info(
      {
        bookingId: req.body.bookingId,
        paymentId: result.payment.id,
        paymentStatus: result.payment.status,
      },
      'payment processed',
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function webhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentsService.handleWebhook(req.body);
    req.log.info(
      { eventId: req.body.eventId, paymentId: req.body.paymentId, result: result.result },
      'webhook handled',
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}