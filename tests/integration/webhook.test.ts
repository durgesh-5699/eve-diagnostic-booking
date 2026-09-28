import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { pool } from '../../src/db/pool';
import { simulatePaymentOutcome } from '../../src/modules/payments/payment.simulator';
import { app, bearer, registerUser, createBookingFor, MISSING_ID } from '../helpers/api';

vi.mock('../../src/modules/payments/payment.simulator');

async function makePayment(outcome: 'SUCCESS' | 'FAILED') {
  const { token } = await registerUser();
  const { booking } = await createBookingFor(token);
  vi.mocked(simulatePaymentOutcome).mockReturnValue(outcome);
  const res = await request(app)
    .post('/payments')
    .set(bearer(token))
    .send({ bookingId: booking.id });
  return { bookingId: booking.id as string, paymentId: res.body.payment.id as string };
}

function sendWebhook(eventId: string, paymentId: string, status: string) {
  return request(app).post('/payments/webhook').send({ eventId, paymentId, status });
}

async function getStates(bookingId: string, paymentId: string) {
  const booking = await pool.query('SELECT status FROM bookings WHERE id = $1', [bookingId]);
  const payment = await pool.query('SELECT status FROM payments WHERE id = $1', [paymentId]);
  return { booking: booking.rows[0].status, payment: payment.rows[0].status };
}

async function countRows(table: 'payments' | 'webhook_events' | 'bookings') {
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ${table}`);
  return rows[0].n as number;
}

describe('POST /payments/webhook', () => {
  it('applies a late SUCCESS to a FAILED payment and confirms the booking', async () => {
    const { bookingId, paymentId } = await makePayment('FAILED');

    const res = await sendWebhook('evt_1', paymentId, 'SUCCESS');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ result: 'applied' });
    expect(await getStates(bookingId, paymentId)).toEqual({ booking: 'CONFIRMED', payment: 'SUCCESS' });
  });

  it('is idempotent: the same event delivered twice changes nothing the second time', async () => {
    const { bookingId, paymentId } = await makePayment('FAILED');

    const first = await sendWebhook('evt_1', paymentId, 'SUCCESS');
    const second = await sendWebhook('evt_1', paymentId, 'SUCCESS');

    expect(first.body.result).toBe('applied');
    expect(second.status).toBe(200);
    expect(second.body.result).toBe('duplicate');
    expect(await getStates(bookingId, paymentId)).toEqual({ booking: 'CONFIRMED', payment: 'SUCCESS' });
    expect(await countRows('webhook_events')).toBe(1);
    expect(await countRows('payments')).toBe(1);
    expect(await countRows('bookings')).toBe(1);
  });

  it('a redelivered event does not resurrect old state', async () => {
    const { bookingId, paymentId } = await makePayment('FAILED');
    await sendWebhook('evt_1', paymentId, 'SUCCESS');
    await sendWebhook('evt_2', paymentId, 'FAILED'); // conflicting, ignored

    const replay = await sendWebhook('evt_2', paymentId, 'FAILED');

    expect(replay.body.result).toBe('duplicate');
    expect(await getStates(bookingId, paymentId)).toEqual({ booking: 'CONFIRMED', payment: 'SUCCESS' });
  });

  it('never downgrades a SUCCESS payment (new event with conflicting status is ignored)', async () => {
    const { bookingId, paymentId } = await makePayment('SUCCESS');

    const res = await sendWebhook('evt_1', paymentId, 'FAILED');

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('ignored');
    expect(await getStates(bookingId, paymentId)).toEqual({ booking: 'CONFIRMED', payment: 'SUCCESS' });
  });

  it('reports already_applied when a new event carries the current status', async () => {
    const success = await makePayment('SUCCESS');
    const failed = await makePayment('FAILED');

    const a = await sendWebhook('evt_a', success.paymentId, 'SUCCESS');
    const b = await sendWebhook('evt_b', failed.paymentId, 'FAILED');

    expect(a.body.result).toBe('already_applied');
    expect(b.body.result).toBe('already_applied');
  });

  it('does not touch a CANCELLED booking', async () => {
    const { bookingId, paymentId } = await makePayment('FAILED');
    await pool.query("UPDATE bookings SET status = 'CANCELLED' WHERE id = $1", [bookingId]);

    const res = await sendWebhook('evt_1', paymentId, 'SUCCESS');

    expect(res.body.result).toBe('ignored');
    expect(await getStates(bookingId, paymentId)).toEqual({ booking: 'CANCELLED', payment: 'FAILED' });
  });

  it('returns 404 for an unknown payment and does not record the event', async () => {
    const res = await sendWebhook('evt_1', MISSING_ID, 'SUCCESS');

    expect(res.status).toBe(404);
    expect(await countRows('webhook_events')).toBe(0);
  });

  it.each([
    ['missing eventId', { paymentId: MISSING_ID, status: 'SUCCESS' }],
    ['empty eventId', { eventId: '', paymentId: MISSING_ID, status: 'SUCCESS' }],
    ['invalid paymentId', { eventId: 'evt_1', paymentId: 'nope', status: 'SUCCESS' }],
    ['PENDING status', { eventId: 'evt_1', paymentId: MISSING_ID, status: 'PENDING' }],
    ['unknown status', { eventId: 'evt_1', paymentId: MISSING_ID, status: 'REFUNDED' }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await request(app).post('/payments/webhook').send(body);
    expect(res.status).toBe(400);
  });

  it('under concurrency: the same event sent 10 times is applied exactly once', async () => {
    const { bookingId, paymentId } = await makePayment('FAILED');

    const results = await Promise.all(
      Array.from({ length: 10 }, () => sendWebhook('evt_same', paymentId, 'SUCCESS')),
    );

    results.forEach((r) => expect(r.status).toBe(200));
    expect(results.filter((r) => r.body.result === 'applied')).toHaveLength(1);
    expect(results.filter((r) => r.body.result === 'duplicate')).toHaveLength(9);
    expect(await countRows('webhook_events')).toBe(1);
    expect(await countRows('payments')).toBe(1);
    expect(await getStates(bookingId, paymentId)).toEqual({ booking: 'CONFIRMED', payment: 'SUCCESS' });
  });

  it('under concurrency: conflicting events never leave payment and booking inconsistent', async () => {
    const { bookingId, paymentId } = await makePayment('FAILED');

    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        sendWebhook(`evt_${i}`, paymentId, i % 2 === 0 ? 'SUCCESS' : 'FAILED'),
      ),
    );

    results.forEach((r) => expect(r.status).toBe(200));
    // FAILED -> SUCCESS sirf ek hi baar ho sakta hai
    expect(results.filter((r) => r.body.result === 'applied')).toHaveLength(1);
    expect(await getStates(bookingId, paymentId)).toEqual({ booking: 'CONFIRMED', payment: 'SUCCESS' });
  });
});