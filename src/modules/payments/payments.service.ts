import { AppError } from '../../utils/AppError';
import { withTransaction } from '../../db/transaction';
import * as bookingsRepository from '../bookings/bookings.repository';
import * as paymentsRepository from './payments.repository';
import { simulatePaymentOutcome } from './payment.simulator';
import type { WebhookInput } from './payments.schema';

export async function processPayment(userId: string, bookingId: string) {
  return withTransaction(async (client) => {
    // Row lock: ek hi booking pe do simultaneous payments serialize ho jaate hain
    const booking = await bookingsRepository.findBookingByIdForUpdate(bookingId, client);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    if (booking.user_id !== userId) {
      throw new AppError(403, 'You are not authorized to pay for this booking');
    }
    if (booking.status !== 'PENDING') {
      throw new AppError(409, `Booking is already ${booking.status}; payment not allowed`);
    }

    const outcome = simulatePaymentOutcome();

    const payment = await paymentsRepository.createPayment(
      { bookingId, amount: Number(booking.amount), status: outcome },
      client,
    );
    const updatedBooking = await bookingsRepository.updateBookingStatus(
      bookingId,
      outcome === 'SUCCESS' ? 'CONFIRMED' : 'FAILED',
      client,
    );

    return { payment, booking: updatedBooking };
  });
}

export type WebhookResult = 'applied' | 'duplicate' | 'already_applied' | 'ignored';

export async function handleWebhook(input: WebhookInput): Promise<{ result: WebhookResult }> {
  return withTransaction(async (client) => {
    // 1. Idempotency gate: same eventId dobara aaya to yahin ruk jaao
    const isNewEvent = await paymentsRepository.insertWebhookEvent(input.eventId, input, client);
    if (!isNewEvent) {
      return { result: 'duplicate' };
    }

    // 2. Payment dhundo (sirf booking_id janne ke liye)
    const found = await paymentsRepository.findPaymentById(input.paymentId, client);
    if (!found) {
      throw new AppError(404, 'Payment not found'); // rollback: event bhi record nahi hoga
    }

    // 3. Booking lock karo, phir payment dobara padho (lock ke andar ka data hi sach hai)
    const booking = await bookingsRepository.findBookingByIdForUpdate(found.booking_id, client);
    const payment = await paymentsRepository.findPaymentById(input.paymentId, client);
    if (!booking || !payment) {
      throw new AppError(404, 'Payment not found');
    }

    // 4. State machine
    const isAllowedTransition =
      payment.status === 'PENDING' ||
      (payment.status === 'FAILED' && input.status === 'SUCCESS');

    if (!isAllowedTransition) {
      return { result: payment.status === input.status ? 'already_applied' : 'ignored' };
    }
    if (booking.status === 'CANCELLED') {
      return { result: 'ignored' };
    }

    // 5. Apply
    await paymentsRepository.updatePaymentStatus(payment.id, input.status, client);
    await bookingsRepository.updateBookingStatus(
      booking.id,
      input.status === 'SUCCESS' ? 'CONFIRMED' : 'FAILED',
      client,
    );

    return { result: 'applied' };
  });
}