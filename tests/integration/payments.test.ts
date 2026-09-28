import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { pool } from '../../src/db/pool';
import { simulatePaymentOutcome } from '../../src/modules/payments/payment.simulator';
import { app, bearer, registerUser, createBookingFor, MISSING_ID } from '../helpers/api';

vi.mock('../../src/modules/payments/payment.simulator');

function payWith(outcome: 'SUCCESS' | 'FAILED', token: string, bookingId: string) {
  vi.mocked(simulatePaymentOutcome).mockReturnValue(outcome);
  return request(app).post('/payments').set(bearer(token)).send({ bookingId });
}

describe('POST /payments', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/payments').send({ bookingId: MISSING_ID });
    expect(res.status).toBe(401);
  });

  it('on SUCCESS: creates a SUCCESS payment and CONFIRMS the booking', async () => {
    const { token } = await registerUser();
    const { booking } = await createBookingFor(token, 750);

    const res = await payWith('SUCCESS', token, booking.id);

    expect(res.status).toBe(201);
    expect(res.body.payment).toMatchObject({
      booking_id: booking.id,
      status: 'SUCCESS',
      amount: '750.00',
    });
    expect(res.body.booking.status).toBe('CONFIRMED');
  });

  it('on FAILED: creates a FAILED payment and marks the booking FAILED', async () => {
    const { token } = await registerUser();
    const { booking } = await createBookingFor(token);

    const res = await payWith('FAILED', token, booking.id);

    expect(res.status).toBe(201);
    expect(res.body.payment.status).toBe('FAILED');
    expect(res.body.booking.status).toBe('FAILED');
  });

  it('rejects paying for an already CONFIRMED booking with 409', async () => {
    const { token } = await registerUser();
    const { booking } = await createBookingFor(token);
    await payWith('SUCCESS', token, booking.id);

    const res = await payWith('SUCCESS', token, booking.id);

    expect(res.status).toBe(409);
  });

  it('does not allow a second payment attempt on a FAILED booking', async () => {
    const { token } = await registerUser();
    const { booking } = await createBookingFor(token);
    await payWith('FAILED', token, booking.id);

    const res = await payWith('SUCCESS', token, booking.id);

    expect(res.status).toBe(409);
  });

  it('returns 403 when paying for someone else\'s booking', async () => {
    const owner = await registerUser();
    const intruder = await registerUser();
    const { booking } = await createBookingFor(owner.token);

    const res = await payWith('SUCCESS', intruder.token, booking.id);

    expect(res.status).toBe(403);
    const { rows } = await pool.query('SELECT status FROM bookings WHERE id = $1', [booking.id]);
    expect(rows[0].status).toBe('PENDING');
  });

  it('returns 404 for an unknown booking', async () => {
    const { token } = await registerUser();
    const res = await payWith('SUCCESS', token, MISSING_ID);
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed bookingId', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/payments')
      .set(bearer(token))
      .send({ bookingId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  it('creates exactly one payment when the same booking is paid concurrently', async () => {
    const { token } = await registerUser();
    const { booking } = await createBookingFor(token);
    vi.mocked(simulatePaymentOutcome).mockReturnValue('SUCCESS');

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).post('/payments').set(bearer(token)).send({ bookingId: booking.id }),
      ),
    );

    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(4);

    const { rows } = await pool.query(
      'SELECT count(*)::int AS n FROM payments WHERE booking_id = $1',
      [booking.id],
    );
    expect(rows[0].n).toBe(1);
  });
});