import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be set and reasonably long'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  POSTGRES_USER:z.string(),
  POSTGRES_PASSWORD:z.string(),
  POSTGRES_DB:z.string(),
  PAYMENT_SUCCESS_RATE: z.coerce.number().min(0).max(1).default(0.8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;