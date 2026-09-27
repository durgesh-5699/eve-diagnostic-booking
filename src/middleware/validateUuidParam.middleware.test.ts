import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { validateUuidParam } from './validateUuidParam.middleware';

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('validateUuidParam middleware', () => {
  it('calls next() with no error for a valid UUID', () => {
    const req = { params: { id: '123e4567-e89b-12d3-a456-426614174000' } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    validateUuidParam('id')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() with a 400 AppError for an invalid UUID', () => {
    const req = { params: { id: 'not-a-uuid' } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    validateUuidParam('id')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});