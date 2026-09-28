import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../helpers/api';

describe('app-level behaviour', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Route not found' });
  });

  it('returns 400 (not 500) for malformed JSON', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken"');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Malformed JSON body' });
  });

    it('sets an x-request-id header and echoes a client-supplied one', async () => {
    const generated = await request(app).get('/health');
    expect(generated.headers['x-request-id']).toEqual(expect.any(String));

    const echoed = await request(app).get('/health').set('x-request-id', 'trace-123');
    expect(echoed.headers['x-request-id']).toBe('trace-123');
  });
});