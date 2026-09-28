import request from 'supertest';
import { createApp } from '../../src/app';

export const app = createApp();

export const MISSING_ID = '11111111-1111-4111-8111-111111111111';

let userCounter = 0;
export function uniqueEmail() {
  userCounter += 1;
  return `user${userCounter}-${Date.now()}@example.com`;
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function futureDate(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function registerUser() {
  const email = uniqueEmail();
  const res = await request(app).post('/auth/signup').send({ email, password: 'password123' });
  return { email, token: res.body.token as string, userId: res.body.user.id as string };
}

export async function createCentreWithTest(price = 499) {
  const centreRes = await request(app)
    .post('/centres')
    .send({ name: 'Apollo Diagnostics', location: 'Bhubaneswar' });
  const centreId = centreRes.body.id as string;

  const testRes = await request(app)
    .post(`/centres/${centreId}/tests`)
    .send({ name: 'Complete Blood Count', price });

  return { centreId, testId: testRes.body.id as string };
}

export async function createBookingFor(token: string, price = 499) {
  const { centreId, testId } = await createCentreWithTest(price);
  const res = await request(app)
    .post('/bookings')
    .set(bearer(token))
    .send({ testId, centreId, appointmentAt: futureDate() });
  return { booking: res.body, centreId, testId };
}