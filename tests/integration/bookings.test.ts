import { describe, it, expect } from 'vitest';
import request from 'supertest';
import {
  app,
  bearer,
  registerUser,
  createCentreWithTest,
  createBookingFor,
  futureDate,
  MISSING_ID,
} from '../helpers/api';

describe('POST /bookings', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/bookings').send({});
    expect(res.status).toBe(401);
  });

  it('creates a PENDING booking and takes the amount from the test price, not the client', async () => {
    const { token, userId } = await registerUser();
    const { centreId, testId } = await createCentreWithTest(499);

    const res = await request(app)
      .post('/bookings')
      .set(bearer(token))
      .send({ testId, centreId, appointmentAt: futureDate(), amount: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      user_id: userId,
      test_id: testId,
      centre_id: centreId,
      status: 'PENDING',
      amount: '499.00',
    });
  });

  it('rejects an appointment in the past', async () => {
    const { token } = await registerUser();
    const { centreId, testId } = await createCentreWithTest();

    const res = await request(app)
      .post('/bookings')
      .set(bearer(token))
      .send({ testId, centreId, appointmentAt: '2020-01-01T10:00:00Z' });

    expect(res.status).toBe(400);
  });

  it('rejects a test that does not belong to the given centre', async () => {
    const { token } = await registerUser();
    const first = await createCentreWithTest();
    const second = await createCentreWithTest();

    const res = await request(app)
      .post('/bookings')
      .set(bearer(token))
      .send({ testId: first.testId, centreId: second.centreId, appointmentAt: futureDate() });

    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown test', async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post('/bookings')
      .set(bearer(token))
      .send({ testId: MISSING_ID, centreId: MISSING_ID, appointmentAt: futureDate() });

    expect(res.status).toBe(404);
  });

  it('rejects an invalid body', async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post('/bookings')
      .set(bearer(token))
      .send({ testId: 'x', centreId: 'y', appointmentAt: 'not-a-date' });

    expect(res.status).toBe(400);
  });
});

describe('GET /bookings', () => {
  it('lists only the caller\'s own bookings', async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    await createBookingFor(alice.token);
    await createBookingFor(alice.token);
    await createBookingFor(bob.token);

    const res = await request(app).get('/bookings').set(bearer(alice.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((b: { user_id: string }) => b.user_id === alice.userId)).toBe(true);
  });
});

describe('GET /bookings/:id', () => {
  it('returns the owner\'s booking', async () => {
    const { token } = await registerUser();
    const { booking } = await createBookingFor(token);

    const res = await request(app).get(`/bookings/${booking.id}`).set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(booking.id);
  });

  it('returns 403 when another user asks for it', async () => {
    const owner = await registerUser();
    const intruder = await registerUser();
    const { booking } = await createBookingFor(owner.token);

    const res = await request(app).get(`/bookings/${booking.id}`).set(bearer(intruder.token));

    expect(res.status).toBe(403);
  });

  it('returns 404 for an unknown booking', async () => {
    const { token } = await registerUser();
    const res = await request(app).get(`/bookings/${MISSING_ID}`).set(bearer(token));
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed booking id', async () => {
    const { token } = await registerUser();
    const res = await request(app).get('/bookings/not-a-uuid').set(bearer(token));
    expect(res.status).toBe(400);
  });
});