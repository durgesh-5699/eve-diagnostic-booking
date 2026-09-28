import { describe, it, expect } from 'vitest';
import { openApiSpec } from './openapi';

function collectRefs(node: unknown, refs: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((item) => collectRefs(item, refs));
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string') refs.push(value);
      else collectRefs(value, refs);
    }
  }
  return refs;
}

function resolveRef(ref: string): unknown {
  return ref
    .replace(/^#\//, '')
    .split('/')
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], openApiSpec);
}

const paths = openApiSpec.paths as Record<string, Record<string, { security?: unknown }>>;

describe('OpenAPI spec', () => {
  it('is OpenAPI 3.x', () => {
    expect(openApiSpec.openapi).toMatch(/^3\./);
  });

  it('has no broken $ref', () => {
    const refs = collectRefs(openApiSpec);
    expect(refs.length).toBeGreaterThan(0);
    const broken = refs.filter((ref) => resolveRef(ref) === undefined);
    expect(broken).toEqual([]);
  });

  it.each([
    ['get', '/health'],
    ['post', '/auth/signup'],
    ['post', '/auth/login'],
    ['post', '/centres'],
    ['get', '/centres'],
    ['get', '/centres/{id}'],
    ['post', '/centres/{id}/tests'],
    ['get', '/centres/{id}/tests'],
    ['post', '/bookings'],
    ['get', '/bookings'],
    ['get', '/bookings/{id}'],
    ['post', '/payments'],
    ['post', '/payments/webhook'],
  ])('documents %s %s', (method, path) => {
    expect(paths[path]?.[method]).toBeDefined();
  });

  it.each([
    ['post', '/bookings'],
    ['get', '/bookings'],
    ['get', '/bookings/{id}'],
    ['post', '/payments'],
  ])('marks %s %s as requiring a bearer token', (method, path) => {
    expect(paths[path][method].security).toEqual([{ bearerAuth: [] }]);
  });

  it('keeps the webhook public', () => {
    expect(paths['/payments/webhook'].post.security).toBeUndefined();
  });
});