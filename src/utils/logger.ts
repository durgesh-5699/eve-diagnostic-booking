import pino from 'pino';
import type { DestinationStream, LevelWithSilent } from 'pino';
import { env } from '../config/env';

const defaultLevel: LevelWithSilent =
  env.LOG_LEVEL ?? (env.NODE_ENV === 'test' ? 'silent' : 'info');

// Factory alag se export hai taaki test mein output capture karke redaction verify kar sakein
export function createLogger(
  options: { level?: LevelWithSilent; destination?: DestinationStream } = {},
) {
  return pino(
    {
      level: options.level ?? defaultLevel,
      base: { service: 'eve-diagnostic-booking' },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: (label) => ({ level: label }) },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'password',
          '*.password',
          'token',
          '*.token',
        ],
        remove: true,
      },
    },
    options.destination,
  );
}

export const logger = createLogger();