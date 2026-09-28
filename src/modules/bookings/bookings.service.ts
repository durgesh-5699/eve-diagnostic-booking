import { AppError } from '../../utils/AppError';
import * as bookingsRepository from './bookings.repository';
import * as centresRepository from '../centres/centres.repository';
import type { CreateBookingInput } from './bookings.schema';

export async function createBooking(userId: string, input: CreateBookingInput) {
  const test = await centresRepository.findTestById(input.testId);
  if (!test) {
    throw new AppError(404, 'Diagnostic test not found');
  }

  if (test.centre_id !== input.centreId) {
    throw new AppError(400, 'The specified test does not belong to the specified centre');
  }

  return bookingsRepository.createBooking({
    userId,
    testId: input.testId,
    centreId: input.centreId,
    appointmentAt: input.appointmentAt,
    amount: Number(test.price),
  });
}

export async function getBookingForUser(userId: string, bookingId: string) {
  const booking = await bookingsRepository.findBookingById(bookingId);
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }
  if (booking.user_id !== userId) {
    throw new AppError(403, 'You are not authorized to access this booking');
  }
  return booking;
}

export async function listBookingsForUser(userId: string) {
  return bookingsRepository.findBookingsByUserId(userId);
}