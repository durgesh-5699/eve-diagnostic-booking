import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import * as bookingsService from './bookings.service';

export async function createBookingHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const booking = await bookingsService.createBooking(req.user!.userId, req.body);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function getBookingHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const booking = await bookingsService.getBookingForUser(req.user!.userId, req.params.id);
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function listBookingsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const bookings = await bookingsService.listBookingsForUser(req.user!.userId);
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
}