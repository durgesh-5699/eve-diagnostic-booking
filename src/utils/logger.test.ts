import { describe, it, expect } from 'vitest';
import { Writable } from 'node:stream';
import { createLogger } from './logger';

function capture() {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  return { lines, destination };
}

describe('logger', () => {
  it('writes one JSON line with a readable level and the service name', () => {
    const { lines, destination } = capture();
    createLogger({ level: 'info', destination }).info({ userId: 'u1' }, 'hello');

    const entry = JSON.parse(lines[0]);
    expect(entry).toMatchObject({
      level: 'info',
      msg: 'hello',
      userId: 'u1',
      service: 'eve-diagnostic-booking',
    });
  });

  it('never writes bearer tokens or passwords', () => {
    const { lines, destination } = capture();
    createLogger({ level: 'info', destination }).info(
      {
        req: { headers: { authorization: 'Bearer super-secret-jwt', 'user-agent': 'curl' } },
        password: 'hunter2',
        user: { password: 'hunter3' },
        token: 'another-secret',
      },
      'sensitive',
    );

    const output = lines.join('');
    expect(output).not.toContain('super-secret-jwt');
    expect(output).not.toContain('hunter2');
    expect(output).not.toContain('hunter3');
    expect(output).not.toContain('another-secret');
    expect(output).toContain('curl'); // baaki headers bache rehte hain
  });

  it('respects the log level', () => {
    const { lines, destination } = capture();
    createLogger({ level: 'warn', destination }).info('should be dropped');
    expect(lines).toHaveLength(0);
  });
});