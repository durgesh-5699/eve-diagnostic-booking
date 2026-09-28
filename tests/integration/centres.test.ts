import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, MISSING_ID } from '../helpers/api';

describe('centres', () => {
  it('creates a centre', async () => {
    const res = await request(app)
      .post('/centres')
      .send({ name: 'Apollo Diagnostics', location: 'Bhubaneswar' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Apollo Diagnostics', location: 'Bhubaneswar' });
  });

  it.each([
    ['missing name', { location: 'Bhubaneswar' }],
    ['empty location', { name: 'Apollo', location: '' }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await request(app).post('/centres').send(body);
    expect(res.status).toBe(400);
  });

  it('lists centres', async () => {
    await request(app).post('/centres').send({ name: 'A', location: 'X' });
    await request(app).post('/centres').send({ name: 'B', location: 'Y' });

    const res = await request(app).get('/centres');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('adds a test to a centre and returns the centre with its tests', async () => {
    const centre = await request(app).post('/centres').send({ name: 'A', location: 'X' });
    const test = await request(app)
      .post(`/centres/${centre.body.id}/tests`)
      .send({ name: 'CBC', price: 499 });

    expect(test.status).toBe(201);
    expect(test.body).toMatchObject({ centre_id: centre.body.id, name: 'CBC', price: '499.00' });

    const res = await request(app).get(`/centres/${centre.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.tests).toHaveLength(1);
  });

  it.each([
    ['negative price', { name: 'CBC', price: -5 }],
    ['zero price', { name: 'CBC', price: 0 }],
    ['string price', { name: 'CBC', price: '499' }],
    ['missing name', { price: 100 }],
  ])('rejects a test with %s', async (_label, body) => {
    const centre = await request(app).post('/centres').send({ name: 'A', location: 'X' });
    const res = await request(app).post(`/centres/${centre.body.id}/tests`).send(body);
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown centre', async () => {
    const res = await request(app).get(`/centres/${MISSING_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 when adding a test to an unknown centre', async () => {
    const res = await request(app)
      .post(`/centres/${MISSING_ID}/tests`)
      .send({ name: 'CBC', price: 100 });
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed centre id', async () => {
    const res = await request(app).get('/centres/not-a-uuid');
    expect(res.status).toBe(400);
  });
});