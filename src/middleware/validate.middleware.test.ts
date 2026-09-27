import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { validate } from './validate.middleware';
import { signupSchema } from '../modules/auth/auth.schema';

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('validate middleware', () => {
  it('calls next() when the body is valid', () => {
    const req = { body: { email: 'test@example.com', password: 'password123' } } as Request;
    const res = mockRes();
    const next = vi.fn();

    validate(signupSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 400 when the body is invalid', () => {
    const req = { body: { email: 'not-an-email', password: '123' } } as Request;
    const res = mockRes();
    const next = vi.fn();

    validate(signupSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});