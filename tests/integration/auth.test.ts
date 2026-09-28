import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { pool } from '../../src/db/pool';
import { app, uniqueEmail, bearer } from '../helpers/api';

describe('POST /auth/signup', () => {
  it('creates a user and returns a token without leaking the password', async () => {
    const email = uniqueEmail();
    const res = await request(app).post('/auth/signup').send({ email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: expect.any(String), email });
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('stores only a bcrypt hash of the password', async () => {
    const email = uniqueEmail();
    await request(app).post('/auth/signup').send({ email, password: 'password123' });

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [email]);
    expect(rows[0].password_hash).not.toBe('password123');
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email with 409', async () => {
    const email = uniqueEmail();
    await request(app).post('/auth/signup').send({ email, password: 'password123' });
    const res = await request(app).post('/auth/signup').send({ email, password: 'password123' });

    expect(res.status).toBe(409);
  });

  it.each([
    ['invalid email', { email: 'not-an-email', password: 'password123' }],
    ['short password', { email: 'a@example.com', password: '123' }],
    ['missing password', { email: 'a@example.com' }],
    ['empty body', {}],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await request(app).post('/auth/signup').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});

describe('POST /auth/login', () => {
  it('returns a token for valid credentials', async () => {
    const email = uniqueEmail();
    await request(app).post('/auth/signup').send({ email, password: 'password123' });

    const res = await request(app).post('/auth/login').send({ email, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('returns the same 401 message for wrong password and unknown email', async () => {
    const email = uniqueEmail();
    await request(app).post('/auth/signup').send({ email, password: 'password123' });

    const wrongPassword = await request(app).post('/auth/login').send({ email, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/auth/login')
      .send({ email: uniqueEmail(), password: 'password123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe('JWT protection', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/bookings');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app).get('/bookings').set(bearer('garbage.token.value'));
    expect(res.status).toBe(401);
  });

  it('accepts a token issued at signup', async () => {
    const signup = await request(app)
      .post('/auth/signup')
      .send({ email: uniqueEmail(), password: 'password123' });

    const res = await request(app).get('/bookings').set(bearer(signup.body.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});